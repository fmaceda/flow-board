import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Response, Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { JwtPayload, JwtRefreshPayload, AuthenticatedUser } from './auth.types';

const BCRYPT_COST = 12;
const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Injectable()
export class AuthService {
  private readonly refreshTokenTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    // Parse "7d" → seconds. Prisma's JWT expiry strings use the same format as ms/jsonwebtoken.
    this.refreshTokenTtl = this.parseDurationToSeconds(
      this.config.getOrThrow<string>('JWT_REFRESH_EXPIRY'),
    );
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, res: Response): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return this.issueTokensAndRespond(user, res);
  }

  async login(dto: LoginDto, res: Response): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Constant-time comparison path: always run bcrypt.compare even when user
    // is not found (against a dummy hash) so the response time doesn't leak
    // whether the email exists.
    const dummyHash =
      '$2b$12$invalidhashpaddingtomatchbcryptlength.XXXXXXXXXXXXXXXX';
    const passwordHash = user?.passwordHash ?? dummyHash;
    const isMatch = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokensAndRespond(user, res);
  }

  async refresh(req: Request, res: Response): Promise<{ accessToken: string }> {
    const rawToken = this.extractRefreshCookie(req);

    let payload: JwtRefreshPayload;
    try {
      payload = this.jwt.verify<JwtRefreshPayload>(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      // Clear the bad cookie so the browser drops it and the frontend can
      // redirect to /login without the middleware bouncing them back.
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const redisKey = this.refreshKey(payload.sub, payload.jti);
    const stored = await this.redis.get(redisKey);
    if (!stored) {
      // Token was already rotated or Redis was flushed — clear the stale cookie.
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Rotate: invalidate old token, issue a new pair
    await this.redis.del(redisKey);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
    });

    return this.issueTokensAndRespond(user, res);
  }

  async logout(
    user: AuthenticatedUser,
    req: Request,
    res: Response,
  ): Promise<void> {
    const rawToken = (req.cookies as Record<string, string>)?.[
      REFRESH_TOKEN_COOKIE
    ];

    if (rawToken) {
      try {
        const payload = this.jwt.verify<JwtRefreshPayload>(rawToken, {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });
        await this.redis.del(this.refreshKey(user.userId, payload.jti));
      } catch {
        // Token is invalid/expired — nothing to revoke, proceed to clear cookie
      }
    }

    this.clearRefreshCookie(res);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async issueTokensAndRespond(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    },
    res: Response,
  ): Promise<AuthResponseDto> {
    const accessToken = this.signAccessToken(user.id, user.email);
    const { refreshToken, tokenId } = this.signRefreshToken(
      user.id,
      user.email,
    );

    await this.redis.set(
      this.refreshKey(user.id, tokenId),
      '1',
      this.refreshTokenTtl,
    );

    this.setRefreshCookie(res, refreshToken);

    const userDto: AuthUserDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };

    return { accessToken, user: userDto };
  }

  private signAccessToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    // expiresIn is typed as StringValue in @nestjs/jwt v11; cast via unknown to satisfy the overload.
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.getOrThrow<string>(
        'JWT_EXPIRY',
      ) as unknown as number,
    });
  }

  private signRefreshToken(
    userId: string,
    email: string,
  ): { refreshToken: string; tokenId: string } {
    const tokenId = uuidv4();
    const payload: JwtRefreshPayload = { sub: userId, email, jti: tokenId };
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // expiresIn is typed as StringValue in @nestjs/jwt v11; cast via unknown to satisfy the overload.
      expiresIn: this.config.getOrThrow<string>(
        'JWT_REFRESH_EXPIRY',
      ) as unknown as number,
    });
    return { refreshToken, tokenId };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      maxAge: this.refreshTokenTtl * 1000, // milliseconds
      path: '/',
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
    });
  }

  private extractRefreshCookie(req: Request): string {
    const token = (req.cookies as Record<string, string>)?.[
      REFRESH_TOKEN_COOKIE
    ];
    if (!token) {
      throw new UnauthorizedException('Refresh token cookie is missing');
    }
    return token;
  }

  private refreshKey(userId: string, tokenId: string): string {
    return `refresh_token:${userId}:${tokenId}`;
  }

  /**
   * Convert a duration string (e.g. "7d", "15m", "30s") to seconds.
   */
  private parseDurationToSeconds(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) {
      throw new Error(
        `Invalid duration format: "${duration}". Expected e.g. "7d", "15m".`,
      );
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * multipliers[unit];
  }
}

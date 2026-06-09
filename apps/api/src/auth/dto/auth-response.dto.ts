import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ required: false, nullable: true })
  avatarUrl!: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15 min)' })
  accessToken!: string;

  @ApiProperty()
  user!: AuthUserDto;
}

export interface JwtPayload {
  /** Subject — the user's UUID */
  sub: string;
  email: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  /** JWT ID — unique token identifier stored in Redis */
  jti: string;
}

/** Shape attached to request.user after JwtStrategy validates a token */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Allow development defaults so the local dev server can start even when .env isn't set.
const ACCESS_TOKEN_SECRET = process.env["JWT_SECRET"] ?? "dev_access_secret_change_me";
const REFRESH_TOKEN_SECRET = process.env["REFRESH_TOKEN_SECRET"] ?? "dev_refresh_secret_change_me";
const ACCESS_TOKEN_EXPIRES_IN = process.env["ACCESS_TOKEN_EXPIRES_IN"] ?? "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env["REFRESH_TOKEN_EXPIRES_IN"] ?? "7d";

if (!process.env["JWT_SECRET"]) {
  // eslint-disable-next-line no-console
  console.warn("Warning: JWT_SECRET not set in environment — using development default. Change JWT_SECRET in .env for production.");
}

// Use bcrypt for password hashing
export function hashPassword(password: string): string {
  // bcrypt.hashSync is OK for a simple backend; if you prefer, switch to async hash
  const rounds = 10;
  return bcrypt.hashSync(password, rounds);
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    return bcrypt.compareSync(password, stored);
  } catch (e) {
    return false;
  }
}

export interface JwtPayload {
  userId: string;
  role: "OWNER" | "ADMIN" | "STAFF";
}

// Access / Refresh token helpers
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET as string, { expiresIn: ACCESS_TOKEN_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET as string, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET as string) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET as string) as JwtPayload;
}

// In-memory refresh token store. For production, persist refresh tokens in DB and support multiple tokens per user.
const refreshTokens = new Set<string>();

export function storeRefreshToken(token: string) {
  refreshTokens.add(token);
}

export function revokeRefreshToken(token: string) {
  refreshTokens.delete(token);
}

export function isRefreshTokenValid(token: string) {
  return refreshTokens.has(token);
}
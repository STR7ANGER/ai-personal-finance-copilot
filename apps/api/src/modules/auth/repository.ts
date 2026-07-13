import type { EncryptedValue } from "./crypto.js";

export type AuthUser = { id: string; email: string; passwordHash: string; passwordSalt: string };
export type SecurityEvent = { actorUserId?: string; action: string; targetId?: string; requestId: string; metadata?: Record<string, string> };

export interface AuthRepository {
  findByEmail(emailNormalized: string): Promise<AuthUser | null>;
  createUser(input: AuthUser & { emailNormalized: string; profile: EncryptedValue }): Promise<void>;
  createSession(input: { id: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findUserBySession(tokenHash: string, now: Date): Promise<Pick<AuthUser, "id" | "email"> | null>;
  revokeSession(tokenHash: string, revokedAt: Date): Promise<void>;
  appendSecurityEvent(event: SecurityEvent): Promise<void>;
}

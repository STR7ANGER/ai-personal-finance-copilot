import { randomBytes, randomUUID } from "node:crypto";
import { encryptValue, hashPassword, hashToken, verifyPassword } from "./crypto.js";
import type { AuthRepository } from "./repository.js";

export class AuthError extends Error {
  constructor(readonly code: "EMAIL_TAKEN" | "INVALID_CREDENTIALS" | "UNAUTHENTICATED") { super(code); }
}

export class AuthService {
  constructor(private readonly repository: AuthRepository, private readonly profileKey: Buffer) {}

  async register(input: { email: string; password: string; displayName: string; requestId: string }) {
    const emailNormalized = input.email.trim().toLowerCase();
    if (await this.repository.findByEmail(emailNormalized)) throw new AuthError("EMAIL_TAKEN");
    const id = randomUUID();
    const password = await hashPassword(input.password);
    await this.repository.createUser({ id, email: input.email.trim(), emailNormalized, passwordHash: password.hash, passwordSalt: password.salt, profile: encryptValue(input.displayName.trim(), this.profileKey, id) });
    await this.repository.appendSecurityEvent({ actorUserId: id, action: "auth.user_registered", targetId: id, requestId: input.requestId });
    return { id, email: input.email.trim() };
  }

  async login(input: { email: string; password: string; requestId: string }) {
    const user = await this.repository.findByEmail(input.email.trim().toLowerCase());
    if (!user || !(await verifyPassword(input.password, user.passwordHash, user.passwordSalt))) {
      await this.repository.appendSecurityEvent({ action: "auth.login_failed", requestId: input.requestId, metadata: { emailHash: hashToken(input.email.trim().toLowerCase()) } });
      throw new AuthError("INVALID_CREDENTIALS");
    }
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await this.repository.createSession({ id: randomUUID(), userId: user.id, tokenHash: hashToken(token), expiresAt });
    await this.repository.appendSecurityEvent({ actorUserId: user.id, action: "auth.login_succeeded", targetId: user.id, requestId: input.requestId });
    return { token, expiresAt, user: { id: user.id, email: user.email } };
  }

  async authenticate(token: string | undefined) {
    if (!token) throw new AuthError("UNAUTHENTICATED");
    const user = await this.repository.findUserBySession(hashToken(token), new Date());
    if (!user) throw new AuthError("UNAUTHENTICATED");
    return user;
  }

  async logout(token: string | undefined, requestId: string) {
    if (!token) return;
    const user = await this.repository.findUserBySession(hashToken(token), new Date());
    await this.repository.revokeSession(hashToken(token), new Date());
    await this.repository.appendSecurityEvent({ ...(user ? { actorUserId: user.id, targetId: user.id } : {}), action: "auth.logout", requestId });
  }
}

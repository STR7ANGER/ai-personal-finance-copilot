import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptValue, encryptValue, hashToken } from "../src/modules/auth/crypto.js";
import type { AuthRepository, AuthUser, SecurityEvent } from "../src/modules/auth/repository.js";
import { AuthError, AuthService } from "../src/modules/auth/service.js";

class MemoryAuthRepository implements AuthRepository {
  users = new Map<string, AuthUser>(); sessions = new Map<string, { userId: string; expiresAt: Date; revoked: boolean }>(); events: SecurityEvent[] = [];
  async findByEmail(email: string) { return this.users.get(email) ?? null; }
  async createUser(input: AuthUser & { emailNormalized: string }) { this.users.set(input.emailNormalized, input); }
  async createSession(input: { userId: string; tokenHash: string; expiresAt: Date }) { this.sessions.set(input.tokenHash, { userId: input.userId, expiresAt: input.expiresAt, revoked: false }); }
  async findUserBySession(tokenHash: string, now: Date) { const session = this.sessions.get(tokenHash); if (!session || session.revoked || session.expiresAt <= now) return null; const user = [...this.users.values()].find((candidate) => candidate.id === session.userId); return user ? { id: user.id, email: user.email } : null; }
  async revokeSession(tokenHash: string) { const session = this.sessions.get(tokenHash); if (session) session.revoked = true; }
  async appendSecurityEvent(event: SecurityEvent) { this.events.push(event); }
}

describe("authentication", () => {
  it("registers, logs in, authenticates, audits, and revokes a session", async () => {
    const repository = new MemoryAuthRepository(); const service = new AuthService(repository, randomBytes(32));
    const user = await service.register({ email: "Person@Example.com", password: "a-long-test-password", displayName: "Person", requestId: "req-1" });
    const login = await service.login({ email: "person@example.com", password: "a-long-test-password", requestId: "req-2" });
    await expect(service.authenticate(login.token)).resolves.toEqual(user);
    await service.logout(login.token, "req-3");
    await expect(service.authenticate(login.token)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(repository.events.map((event) => event.action)).toEqual(["auth.user_registered", "auth.login_succeeded", "auth.logout"]);
  });

  it("returns one generic failure and audits a hashed identifier", async () => {
    const repository = new MemoryAuthRepository(); const service = new AuthService(repository, randomBytes(32));
    await expect(service.login({ email: "missing@example.com", password: "wrong", requestId: "req" })).rejects.toEqual(new AuthError("INVALID_CREDENTIALS"));
    expect(repository.events[0]?.metadata?.emailHash).toBe(hashToken("missing@example.com"));
  });

  it("binds encrypted profile data to its user id", () => {
    const key = randomBytes(32); const encrypted = encryptValue("Private Name", key, "user-1");
    expect(decryptValue(encrypted, key, "user-1")).toBe("Private Name");
    expect(() => decryptValue(encrypted, key, "user-2")).toThrow();
  });
});

import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import type { AuthRepository, AuthUser, SecurityEvent } from "./repository.js";
import type { EncryptedValue } from "./crypto.js";

export class PrismaAuthRepository implements AuthRepository {
  async findByEmail(emailNormalized: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { emailNormalized }, include: { passwordCredential: true } });
    if (!user?.passwordCredential) return null;
    return { id: user.id, email: user.email, passwordHash: user.passwordCredential.passwordHash, passwordSalt: user.passwordCredential.passwordSalt };
  }

  async createUser(input: AuthUser & { emailNormalized: string; profile: EncryptedValue }) {
    await prisma.user.create({ data: { id: input.id, email: input.email, emailNormalized: input.emailNormalized, passwordCredential: { create: { passwordHash: input.passwordHash, passwordSalt: input.passwordSalt } }, profile: { create: input.profile } } });
  }

  async createSession(input: { id: string; userId: string; tokenHash: string; expiresAt: Date }) { await prisma.session.create({ data: input }); }
  async findUserBySession(tokenHash: string, now: Date) {
    const session = await prisma.session.findFirst({ where: { tokenHash, revokedAt: null, expiresAt: { gt: now } }, include: { user: true } });
    return session ? { id: session.user.id, email: session.user.email } : null;
  }
  async revokeSession(tokenHash: string, revokedAt: Date) { await prisma.session.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt } }); }
  async appendSecurityEvent(event: SecurityEvent) {
    const data: Prisma.AuditEventUncheckedCreateInput = {
      action: event.action,
      targetType: "User",
      requestId: event.requestId,
      ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
      ...(event.targetId ? { targetId: event.targetId } : {}),
      ...(event.metadata ? { metadata: event.metadata } : {}),
    };
    await prisma.auditEvent.create({ data });
  }
}

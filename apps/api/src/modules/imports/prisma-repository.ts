import { prisma } from "../../db.js";
import type { ImportRecord, ImportRepository } from "./ports.js";

export class PrismaImportRepository implements ImportRepository {
  async findByChecksum(userId: string, checksum: string): Promise<ImportRecord | null> {
    const record = await prisma.statementImport.findUnique({ where: { userId_checksum: { userId, checksum } } });
    return record ? { id: record.id, userId: record.userId, checksum: record.checksum, objectKey: record.objectKey, originalFileName: record.originalFileName, status: record.status } : null;
  }
  async create(input: ImportRecord & { sizeBytes: number; contentType: string; requestId: string }) { await prisma.statementImport.create({ data: input }); }
  async markFailed(id: string, reason: string) { await prisma.statementImport.updateMany({ where: { id }, data: { status: "FAILED", failureReason: reason, completedAt: new Date() } }); }
}

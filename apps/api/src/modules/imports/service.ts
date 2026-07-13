import { createHash, randomUUID } from "node:crypto";
import type { ImportQueue, ImportRecord, ImportRepository, ObjectStorage } from "./ports.js";

export class ImportError extends Error {
  constructor(readonly code: "INVALID_FILE" | "FILE_TOO_LARGE" | "DUPLICATE_IMPORT" | "IMPORT_FAILED") { super(code); }
}

const allowedTypes = new Set(["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"]);

export class ImportService {
  constructor(private readonly repository: ImportRepository, private readonly storage: ObjectStorage, private readonly queue: ImportQueue) {}

  async start(input: { userId: string; fileName: string; contentType: string; bytes: Uint8Array; requestId: string }) {
    if (!input.fileName.toLowerCase().endsWith(".csv") || !allowedTypes.has(input.contentType) || input.bytes.length === 0) throw new ImportError("INVALID_FILE");
    if (input.bytes.length > 10 * 1024 * 1024) throw new ImportError("FILE_TOO_LARGE");
    const checksum = createHash("sha256").update(input.bytes).digest("hex");
    if (await this.repository.findByChecksum(input.userId, checksum)) throw new ImportError("DUPLICATE_IMPORT");
    const id = randomUUID();
    const objectKey = `users/${input.userId}/imports/${id}.csv`;
    const record: ImportRecord = { id, userId: input.userId, checksum, objectKey, originalFileName: input.fileName, status: "QUEUED" };
    await this.storage.put(objectKey, input.bytes, input.contentType, { importId: id, checksum });
    try {
      await this.repository.create({ ...record, sizeBytes: input.bytes.length, contentType: input.contentType, requestId: input.requestId });
      await this.queue.enqueue({ importId: id, userId: input.userId, objectKey });
    } catch {
      await this.storage.remove(objectKey).catch(() => undefined);
      await this.repository.markFailed(id, "dispatch_failed").catch(() => undefined);
      throw new ImportError("IMPORT_FAILED");
    }
    return record;
  }
}

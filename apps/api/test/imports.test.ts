import { describe, expect, it } from "vitest";
import type { ImportQueue, ImportRecord, ImportRepository, ObjectStorage } from "../src/modules/imports/ports.js";
import { ImportService } from "../src/modules/imports/service.js";

class MemoryImports implements ImportRepository, ObjectStorage, ImportQueue {
  records: ImportRecord[] = [];
  objects = new Map<string, Uint8Array>();
  jobs: Array<{ importId: string; userId: string; objectKey: string }> = [];
  async findByChecksum(userId: string, checksum: string) { return this.records.find((item) => item.userId === userId && item.checksum === checksum) ?? null; }
  async create(input: ImportRecord) { this.records.push(input); }
  async markFailed() {}
  async put(key: string, bytes: Uint8Array) { this.objects.set(key, bytes); }
  async remove(key: string) { this.objects.delete(key); }
  async enqueue(job: { importId: string; userId: string; objectKey: string }) { this.jobs.push(job); }
}

describe("CSV imports", () => {
  it("stores once and dispatches a normalization job", async () => {
    const memory = new MemoryImports();
    const service = new ImportService(memory, memory, memory);
    const bytes = new TextEncoder().encode("date,description,amount\n2026-01-01,Coffee,-4.50");
    const record = await service.start({ userId: "user-1", fileName: "statement.csv", contentType: "text/csv", bytes, requestId: "req-1" });
    expect(memory.objects.get(record.objectKey)).toEqual(bytes);
    expect(memory.jobs).toEqual([{ importId: record.id, userId: "user-1", objectKey: record.objectKey }]);
    await expect(service.start({ userId: "user-1", fileName: "again.csv", contentType: "text/csv", bytes, requestId: "req-2" })).rejects.toMatchObject({ code: "DUPLICATE_IMPORT" });
  });
  it("rejects unsafe payloads before storage", async () => {
    const memory = new MemoryImports(); const service = new ImportService(memory, memory, memory);
    await expect(service.start({ userId: "u", fileName: "x.txt", contentType: "text/plain", bytes: new Uint8Array([1]), requestId: "r" })).rejects.toMatchObject({ code: "INVALID_FILE" });
    await expect(service.start({ userId: "u", fileName: "x.csv", contentType: "text/csv", bytes: new Uint8Array(), requestId: "r" })).rejects.toMatchObject({ code: "INVALID_FILE" });
    await expect(service.start({ userId: "u", fileName: "x.csv", contentType: "text/csv", bytes: new Uint8Array(10 * 1024 * 1024 + 1), requestId: "r" })).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
    expect(memory.objects.size).toBe(0);
  });
});

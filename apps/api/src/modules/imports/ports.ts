export type ImportRecord = { id: string; userId: string; checksum: string; objectKey: string; originalFileName: string; status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" };

export interface ImportRepository {
  findByChecksum(userId: string, checksum: string): Promise<ImportRecord | null>;
  create(input: ImportRecord & { sizeBytes: number; contentType: string; requestId: string }): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
}

export interface ObjectStorage {
  put(key: string, bytes: Uint8Array, contentType: string, metadata: Record<string, string>): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface ImportQueue {
  enqueue(job: { importId: string; userId: string; objectKey: string }): Promise<void>;
}

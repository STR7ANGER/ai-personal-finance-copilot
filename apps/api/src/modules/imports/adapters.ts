import { CreateBucketCommand, DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import Redis from "ioredis";
import type { ImportQueue, ObjectStorage } from "./ports.js";

export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private bucketReady?: Promise<void>;

  constructor(config: { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string }) {
    this.bucket = config.bucket;
    this.client = new S3Client({ endpoint: config.endpoint, region: config.region, forcePathStyle: true, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
  }
  private ensureBucket() { return this.bucketReady ??= this.client.send(new HeadBucketCommand({ Bucket: this.bucket })).then(() => undefined).catch(async () => { await this.client.send(new CreateBucketCommand({ Bucket: this.bucket })); }); }
  async put(key: string, bytes: Uint8Array, contentType: string, metadata: Record<string, string>) { await this.ensureBucket(); await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: bytes, ContentType: contentType, Metadata: metadata })); }
  async remove(key: string) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); }
}

export class RedisImportQueue implements ImportQueue {
  private readonly redis: Redis;
  constructor(url: string) { this.redis = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true }); }
  async enqueue(job: { importId: string; userId: string; objectKey: string }) { if (this.redis.status === "wait") await this.redis.connect(); await this.redis.lpush("finance:imports", JSON.stringify(job)); }
}

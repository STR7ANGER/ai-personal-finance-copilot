import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().min(3),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  PROFILE_ENCRYPTION_KEY: z.string().refine((value) => Buffer.from(value, "base64").length === 32, "Must be a base64-encoded 32-byte key"),
  GEMINI_API_KEY: z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional()),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  OPERATOR_METRICS_TOKEN: z.string().min(32),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  return environmentSchema.parse(input);
}

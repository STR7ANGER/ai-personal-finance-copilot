import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  PROFILE_ENCRYPTION_KEY: z.string().refine((value) => Buffer.from(value, "base64").length === 32, "Must be a base64-encoded 32-byte key"),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  return environmentSchema.parse(input);
}

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  PORT: z.coerce.number().default(5000),
});

export const env = envSchema.parse(process.env);

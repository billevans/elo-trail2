import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),

  DIRECT_URL: z.string(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,

  DIRECT_URL: process.env.DIRECT_URL,

  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,

  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

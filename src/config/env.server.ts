import { z } from 'zod';
const schema = z.object({
  DATABASE_URL: z.string(),
  SHADOW_DATABASE_URL: z.string(),
  KIS_BASE_URL: z.string(),
  KIS_APP_KEY: z.string(),
  KIS_APP_SECRET: z.string(),
  CURRENCYLAYER_COM_APP_KEY: z.string(),
  // ME: z.coerce.number(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables', parsed.error.format());
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

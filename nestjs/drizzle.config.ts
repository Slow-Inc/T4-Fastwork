import { defineConfig } from 'drizzle-kit';

// `generate` only reads the schema (no DB connection); `migrate`/`push` use the
// pooler URL from nestjs/.env.local. Fallback keeps `generate` working before
// the DB password is filled in.
export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder/placeholder',
  },
});

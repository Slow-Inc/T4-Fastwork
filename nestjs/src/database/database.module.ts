import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Global Drizzle client over the Supabase Postgres (Supavisor TRANSACTION
 * pooler, port 6543 — hence `prepare: false`, which the pooler requires).
 * Not yet imported by AppModule: it's wired in once ingestion/retrieval need
 * it and the real DB password is in DATABASE_URL.
 */
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: (): DrizzleDB => {
        const url = process.env.DATABASE_URL;
        if (!url || url.includes('[YOUR-PASSWORD]')) {
          throw new Error(
            'DATABASE_URL is not set to a real pooler connection string yet — ' +
              'paste the Transaction pooler URI (port 6543) into nestjs/.env.local.',
          );
        }
        const client = postgres(url, { prepare: false });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}

/**
 * Live GitHub team-portfolio snapshots (ADR 0003). A durable key→JSONB cache
 * that only the server refresher writes; the read API and pages serve from
 * here so user traffic never calls GitHub. `key` examples:
 *   "repos:<login>" | "org:Slow-Inc" | "languages:<login>/<repo>"
 * `etag` powers conditional requests (304 = unchanged, free of rate limit);
 * `pushedAt` powers delta detection (refetch metadata only when it moves).
 */
import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const githubSnapshots = pgTable('github_snapshots', {
  key: text('key').primaryKey(),
  data: jsonb('data').notNull(),
  etag: text('etag'),
  pushedAt: timestamp('pushed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

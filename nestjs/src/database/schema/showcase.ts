/**
 * Case-study showcase schema (ADR 0009 D1, P1 #64). `blog_posts` already existed
 * (Supabase-only) and is brought under Drizzle here; `project_documents` and
 * `generation_jobs` are new (migration 0020). Provenance is a single `owner`
 * column for the MVP (decision Q4) — immutable revisions + field overrides are a
 * P4 (#67) follow-up.
 */
import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  date,
  timestamp,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';
import { projects } from './content';

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  coverImage: text('cover_image'),
  author: text('author').default('T4 Labs'),
  tags: text('tags').array(),
  publishedAt: date('published_at'),
  readTimeMin: integer('read_time_min').default(5),
  views: integer('views').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  aiRank: integer('ai_rank'),
  aiRankRationale: text('ai_rank_rationale'),
  authorId: integer('author_id'),

  // --- Case-study linkage (ADR 0009 D1) ------------------------------------
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  audience: text('audience'), // 'business' | 'semitech' | 'developer' (null = manual post)
  kind: text('kind').notNull().default('manual'), // 'manual' | 'case_study' | 'deep_dive'
  source: text('source').notNull().default('cms'), // 'cms' | 'github'
  owner: text('owner').notNull().default('human'), // 'auto' | 'human' — regen only rewrites 'auto'
});

/** The per-file Markdown manifest that drives incremental regeneration: only a
 * file whose `blob_sha` changed is re-mapped; `deleted_at` marks a removed file. */
export const projectDocuments = pgTable(
  'project_documents',
  {
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    blobSha: text('blob_sha').notNull(),
    contentHash: text('content_hash'),
    markdown: text('markdown'),
    lastSeenCommit: text('last_seen_commit'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.path] })],
);

/** Idempotent generation job ledger — a matching (manifest, prompt_version) is
 * skipped so an unchanged MD set never re-calls the LLM. */
export const generationJobs = pgTable(
  'generation_jobs',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    inputManifestHash: text('input_manifest_hash').notNull(),
    promptVersion: text('prompt_version').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'done' | 'failed'
    attempts: integer('attempts').notNull().default(0),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.projectId, t.inputManifestHash, t.promptVersion),
  ],
);

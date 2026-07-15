import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { members } from './members';

/**
 * Member- and team-scoped showcase content (Epic C foundation), migrated out of
 * the static `nextjs/content/site.ts` so members can own it and AI ranking (Epic
 * B / B5) can reach it. Mirrors the `members` provenance/ranking idiom.
 *
 * - `member_projects` — a member's personal repos (was `TeamMember.projects`).
 * - `member_certificates` — a member's certs (was `TeamMember.certificates`);
 *   `status` supports C4 additive authoring (member creates `draft` → admin
 *   publishes). Seeded rows are `published`.
 * - `team_projects` — collaborative org repos (was `teamProjects`), not
 *   member-scoped; `contributors` are display handles.
 *
 * `ai_rank` (+ rationale) mirrors the B2 columns on projects/certs/blog so the
 * display-ranking job can order these too. Human `sort_order` pin wins over it.
 */
export const memberProjects = pgTable('member_projects', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  url: text('url').notNull(),
  tech: text('tech').array(),
  year: integer('year').notNull(),
  // A member may choose which of their repos to show (C3 project-selection).
  selected: boolean('selected').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  aiRank: integer('ai_rank'),
  aiRankRationale: text('ai_rank_rationale'),
});

export const memberCertificates = pgTable('member_certificates', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  issuer: text('issuer').notNull(),
  title: text('title').notNull(),
  assetWebp: text('asset_webp'),
  assetPdf: text('asset_pdf'),
  assetImg: text('asset_img'),
  status: text('status').notNull().default('published'),
  sortOrder: integer('sort_order').notNull().default(0),
  aiRank: integer('ai_rank'),
  aiRankRationale: text('ai_rank_rationale'),
});

export const teamProjects = pgTable('team_projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  url: text('url').notNull(),
  tech: text('tech').array(),
  year: integer('year').notNull(),
  contributors: text('contributors').array(),
  sortOrder: integer('sort_order').notNull().default(0),
  aiRank: integer('ai_rank'),
  aiRankRationale: text('ai_rank_rationale'),
});

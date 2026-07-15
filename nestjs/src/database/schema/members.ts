import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';

/**
 * Team members (Epic C, spec 2026-07-15). Migrates the profiles out of the static
 * `nextjs/content/site.ts` `team` array so members can edit their own. GitHub is
 * the baseline source; `*_owner` marks a field human-edited (D1) so a future
 * GitHub sync never overwrites a member's own edit. `github_user_id` is the stable
 * identity key (survives a GitHub login rename). Certificates/projects stay in
 * their own tables / additive (C4).
 */
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  handle: text('handle').notNull().unique(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  githubUserId: integer('github_user_id'),
  githubUrl: text('github_url'),
  role: text('role').notNull(),
  roleEn: text('role_en').notNull(),
  skills: text('skills').array(),
  stack: text('stack').array(),
  education: jsonb('education'),
  readmeVisible: boolean('readme_visible').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  skillsOwner: text('skills_owner').notNull().default('human'),
  stackOwner: text('stack_owner').notNull().default('human'),
});

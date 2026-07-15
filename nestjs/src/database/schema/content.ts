/**
 * Portfolio content (Requirement.MD §6): the RAG source data. Projects,
 * their taxonomy (categories/technologies/tags), services, and FAQs.
 */
import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const technologies = pgTable('technologies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  title: text('title').notNull(),
  titleEn: text('title_en'),
  description: text('description'),
  content: text('content'),
  categoryId: integer('category_id').references(() => categories.id),
  businessTypes: text('business_types').array(),
  snapshotImage: text('snapshot_image'),
  gallery: text('gallery').array(),
  videoUrl: text('video_url'),
  liveUrl: text('live_url'),
  isFeatured: boolean('is_featured').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  sortOrder: integer('sort_order').notNull().default(0),

  // --- Autonomous GitHub showcase (spec 2026-07-14, P2) ---------------------
  // Existing rows default to a human-authored, published CMS project so the
  // curated catalog/CMS content is never touched by auto-regeneration.
  source: text('source').notNull().default('cms'), // 'cms' | 'github'
  status: text('status').notNull().default('published'), // 'draft' | 'published' | 'hidden'

  // GitHub linkage (null for manual/cms entries)
  ghOwner: text('gh_owner'),
  ghRepo: text('gh_repo'),
  ghHtmlUrl: text('gh_html_url'),
  ownerType: text('owner_type').notNull().default('team'), // 'team' | 'personal'
  ownerLogin: text('owner_login'),

  // Per-field provenance ('auto' | 'human'). A human CMS edit flips a field to
  // 'human'; regeneration only rewrites 'auto'-owned fields.
  titleOwner: text('title_owner').notNull().default('human'),
  titleEnOwner: text('title_en_owner').notNull().default('human'),
  descriptionOwner: text('description_owner').notNull().default('human'),
  contentOwner: text('content_owner').notNull().default('human'),
  categoryOwner: text('category_owner').notNull().default('human'),
  tagsOwner: text('tags_owner').notNull().default('human'),
  technologiesOwner: text('technologies_owner').notNull().default('human'),

  // Reconciliation metadata
  readmeSha: text('readme_sha'),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  // --- AI display-ranking (spec 2026-07-15, Epic B) -------------------------
  // Persisted rank (lower = higher priority), computed offline by RankService.
  // A non-zero `sort_order` is the human pin that wins (D1); `ai_rank` orders
  // only the rest. Nullable/additive → safe to apply on prod.
  aiRank: integer('ai_rank'),
  aiRankRationale: text('ai_rank_rationale'),
});

// Many-to-many: projects ↔ technologies / tags.
export const projectTechnologies = pgTable(
  'project_technologies',
  {
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    technologyId: integer('technology_id')
      .notNull()
      .references(() => technologies.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.technologyId] })],
);

export const projectTags = pgTable(
  'project_tags',
  {
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.tagId] })],
);

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  number: integer('number'),
  title: text('title').notNull(),
  targetAudience: text('target_audience'),
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category'),
  sortOrder: integer('sort_order').notNull().default(0),
});

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

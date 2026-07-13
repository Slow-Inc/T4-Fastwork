ALTER TABLE "projects" ADD COLUMN "source" text DEFAULT 'cms' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "gh_owner" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "gh_repo" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "gh_html_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "owner_type" text DEFAULT 'team' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "owner_login" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "title_owner" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "title_en_owner" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "description_owner" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "content_owner" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "category_owner" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tags_owner" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "technologies_owner" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "readme_sha" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "approved_at" timestamp with time zone;
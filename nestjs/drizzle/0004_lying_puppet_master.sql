CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"slug" varchar(160) NOT NULL,
	"github_user_id" integer,
	"github_url" text,
	"role" text NOT NULL,
	"role_en" text NOT NULL,
	"skills" text[],
	"stack" text[],
	"education" jsonb,
	"readme_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"skills_owner" text DEFAULT 'human' NOT NULL,
	"stack_owner" text DEFAULT 'human' NOT NULL,
	CONSTRAINT "members_handle_unique" UNIQUE("handle"),
	CONSTRAINT "members_slug_unique" UNIQUE("slug")
);

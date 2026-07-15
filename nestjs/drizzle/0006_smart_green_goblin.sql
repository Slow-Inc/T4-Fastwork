CREATE TABLE "member_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"issuer" text NOT NULL,
	"title" text NOT NULL,
	"asset_webp" text,
	"asset_pdf" text,
	"asset_img" text,
	"status" text DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_rank" integer,
	"ai_rank_rationale" text
);
--> statement-breakpoint
CREATE TABLE "member_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"tech" text[],
	"year" integer NOT NULL,
	"selected" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_rank" integer,
	"ai_rank_rationale" text
);
--> statement-breakpoint
CREATE TABLE "team_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"tech" text[],
	"year" integer NOT NULL,
	"contributors" text[],
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_rank" integer,
	"ai_rank_rationale" text
);
--> statement-breakpoint
ALTER TABLE "member_certificates" ADD CONSTRAINT "member_certificates_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_projects" ADD CONSTRAINT "member_projects_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
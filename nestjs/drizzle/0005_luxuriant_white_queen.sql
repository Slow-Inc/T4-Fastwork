ALTER TABLE "members" ADD COLUMN "github_login" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "auth_user_id" uuid;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_auth_user_id_unique" UNIQUE("auth_user_id");
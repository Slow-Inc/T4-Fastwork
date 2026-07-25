ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "last_capture_trigger" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "last_capture_dispatch_at" timestamp with time zone;

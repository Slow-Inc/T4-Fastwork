CREATE TABLE "github_snapshots" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"etag" text,
	"pushed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

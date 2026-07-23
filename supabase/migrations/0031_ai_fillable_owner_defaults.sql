-- #170 / #167: AI-fillable project field owners must default to 'auto'.
-- Empty imports that omit these columns previously inherited 'human', so
-- generate-taxonomy / case-study / tech-tag applies correctly skipped forever.
-- Does NOT flip existing rows (remediation already done via #168 SQL).
-- title_* / description_owner stay 'human' (CMS-first titles).

ALTER TABLE projects
  ALTER COLUMN content_owner SET DEFAULT 'auto',
  ALTER COLUMN category_owner SET DEFAULT 'auto',
  ALTER COLUMN tags_owner SET DEFAULT 'auto',
  ALTER COLUMN technologies_owner SET DEFAULT 'auto';

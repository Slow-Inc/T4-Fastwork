<!-- lang:en -->
# Drizzle Raw SQL Array Binding

**Rule.** In Drizzle's `sql` template, a bare `${jsArray}` is **expanded into a comma-separated
list of placeholders** (`$1, $2, $3` — its `IN (...)` behaviour), **not** bound as a single array
value. In a column/value position (e.g. an `INSERT ... VALUES` or a scalar operand) this lands a
row/tuple `($1, $2, $3)` where a `text[]` is expected, and Postgres rejects the statement.

**Do.** Build an explicit array constructor so it is one array value, with every element still a
bound parameter (injection-safe):

```ts
const tags = sql`array[${sql.join(items.map((t) => sql`${t}`), sql`, `)}]::text[]`;
// → array[$1, $2, $3]::text[]   (empty items → array[]::text[], still valid)
await tx.execute(sql`insert into t (…, tags, …) values (…, ${tags}, …)`);
```

**Don't** rely on `${jsArray}::text[]` — the cast does **not** stop the expansion (verified with a
`PgDialect.sqlToQuery` SQL-capture test: the array still renders as separate params).

**Catch it in a unit test.** `PgDialect.sqlToQuery` renders the exact SQL + params, so a
SQL-capture test can assert the array binds as `array[...]::text[]` (and that elements are individual
params) — this would have caught the bug before prod.

**Provenance.** 2026-07-23, Wave 3 case-study generator: the `blog_posts` INSERT used bare
`${gen.tags}`; the canary write threw on prod (`attempted:1, generated:0`, silent until error logging
was added). The dormant `pg-case-study.store` (never run) carried the same latent bug, inherited by
copy; `pg-generate.store`'s `any(${arr}::text[])` likely shares it. Fixed in PR #124.

See also: [[Evidence Before Completion]] (the fix was verified by an actual prod `apply` +
`/blog/<slug>-case-study` 200, not just green tests), [[Deliberate Diagnosis Loop]] (silent
catch → add logging → read the runtime log → the expanded-tuple SQL named the cause).

/**
 * Drizzle `sql` template expands a bare `${jsArray}` into separate placeholders
 * (IN-list style), not one array value — see vault note "Drizzle Raw SQL Array
 * Binding" and issue #126. Build an explicit `array[...]::text[]` constructor.
 */
import { SQL, sql } from 'drizzle-orm';

export function sqlTextArray(items: readonly string[]): SQL {
  if (items.length === 0) return sql`array[]::text[]`;
  return sql`array[${sql.join(
    items.map((t) => sql`${t}`),
    sql`, `,
  )}]::text[]`;
}

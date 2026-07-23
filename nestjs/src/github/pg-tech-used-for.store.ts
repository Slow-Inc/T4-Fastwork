import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { TechUsedFor } from './tech-used-for';
import type {
  TechUsedForRow,
  TechUsedForStore,
} from './tech-used-for.service';

/**
 * Postgres store for D4 tech "used for" blurbs (#131). Superuser pooler bypasses RLS.
 */
@Injectable()
export class PgTechUsedForStore implements TechUsedForStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listTechsNeedingUsedFor(): Promise<TechUsedForRow[]> {
    const rows = (await this.db.execute(
      sql`select id, name, used_for, used_for_owner
          from technologies
          order by name, id`,
    )) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      usedFor: typeof r.used_for === 'string' ? r.used_for : null,
      usedForOwner: r.used_for_owner === 'human' ? 'human' : 'auto',
    }));
  }

  async applyUsedFor(techId: number, blurb: TechUsedFor): Promise<void> {
    await this.db.execute(
      sql`update technologies set
            used_for = case when used_for_owner = 'auto' then ${blurb.usedFor} else used_for end,
            used_for_en = case when used_for_owner = 'auto' then ${blurb.usedForEn} else used_for_en end
          where id = ${techId}`,
    );
  }
}

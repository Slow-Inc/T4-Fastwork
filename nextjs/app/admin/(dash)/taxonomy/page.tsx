import { createClient } from '@/lib/server';
import { deleteTerm } from './actions';
import { TermForm } from './term-form';

interface Term {
  id: number;
  name: string;
  slug: string;
}

const GROUPS = [
  { table: 'categories', title: 'หมวดหมู่', withEn: true },
  { table: 'technologies', title: 'เทคโนโลยี', withEn: false },
  { table: 'tags', title: 'แท็ก', withEn: false },
] as const;

export default async function AdminTaxonomy() {
  const supabase = await createClient();
  const results = await Promise.all(
    GROUPS.map((g) => supabase.from(g.table).select('id, name, slug').order('id')),
  );

  return (
    <div className="admin-page">
      <h1>หมวดหมู่ / เทคโนโลยี / แท็ก</h1>
      <p className="t-meta">คำที่ใช้จัดหมวดและกรองผลงาน</p>

      <div className="tax-groups">
        {GROUPS.map((g, i) => {
          const terms = (results[i].data ?? []) as Term[];
          return (
            <section key={g.table} className="tax-group">
              <h2>{g.title}</h2>
              <TermForm table={g.table} withEn={g.withEn} />
              <ul className="tax-list">
                {terms.map((t) => (
                  <li key={t.id} className="tax-chip">
                    <span>{t.name}</span>
                    <form action={deleteTerm}>
                      <input type="hidden" name="table" value={g.table} />
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" aria-label="ลบ" className="tax-del">
                        ✕
                      </button>
                    </form>
                  </li>
                ))}
                {terms.length === 0 && <li className="t-meta">ยังไม่มี</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

import { createClient } from '@/lib/server';
import { deleteFaq } from './actions';
import { FaqForm } from './faq-form';

export default async function AdminFaqs() {
  const supabase = await createClient();
  const { data: faqs } = await supabase
    .from('faqs')
    .select('id, question, answer, category, sort_order')
    .order('sort_order', { ascending: true });

  return (
    <div className="admin-page">
      <h1>FAQ</h1>
      <p className="t-meta">คำถามที่พบบ่อย (ใช้ทั้งหน้า /faq และผู้ช่วย AI)</p>

      <div className="admin-form-card">
        <FaqForm />
      </div>

      {faqs && faqs.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>คำถาม</th>
                <th>หมวด</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f.id}>
                  <td className="t-meta">{f.sort_order}</td>
                  <td className="admin-cell-wide">{f.question}</td>
                  <td className="t-meta">{f.category || '—'}</td>
                  <td>
                    <form action={deleteFaq}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit" className="admin-del">ลบ</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">ยังไม่มี FAQ</p>
      )}
    </div>
  );
}

import { createClient } from '@/lib/server';
import { deleteService } from './actions';
import { ServiceForm } from './service-form';

export default async function AdminServices() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from('services')
    .select('id, number, title, target_audience, sort_order')
    .order('sort_order', { ascending: true });

  return (
    <div className="admin-page">
      <h1>บริการ</h1>
      <p className="t-meta">รายการบริการ (ใช้กับผู้ช่วย AI และการแนะนำ)</p>

      <div className="admin-form-card">
        <ServiceForm />
      </div>

      {services && services.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ชื่อ</th>
                <th>กลุ่มที่เหมาะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="t-meta">{s.number ?? '—'}</td>
                  <td>{s.title}</td>
                  <td className="t-meta">{s.target_audience || '—'}</td>
                  <td>
                    <form action={deleteService}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="admin-del">ลบ</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">ยังไม่มีบริการ</p>
      )}
    </div>
  );
}

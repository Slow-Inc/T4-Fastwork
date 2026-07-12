import { createClient } from '@/lib/server';

export default async function AdminLeads() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="admin-page">
      <h1>Leads</h1>
      <p className="t-meta">คำขอติดต่อจากฟอร์มหน้า /contact</p>
      {leads && leads.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>ประเภท</th>
                <th>ข้อความ</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="t-meta">{new Date(l.created_at).toLocaleDateString('th-TH')}</td>
                  <td>{l.name}</td>
                  <td>{l.email}</td>
                  <td>{l.project_type || '—'}</td>
                  <td className="admin-cell-wide">{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">ยังไม่มี lead</p>
      )}
    </div>
  );
}

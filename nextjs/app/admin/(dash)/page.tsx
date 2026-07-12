import Link from 'next/link';
import { createClient } from '@/lib/server';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [projects, leads, conversations] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'ผลงาน', value: projects.count ?? 0, href: '/admin/projects' },
    { label: 'Leads', value: leads.count ?? 0, href: '/admin/leads' },
    { label: 'บทสนทนา AI', value: conversations.count ?? 0, href: '/admin/conversations' },
  ];

  return (
    <div className="admin-page">
      <h1>ภาพรวม</h1>
      <div className="admin-stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="admin-stat">
            <span className="admin-stat-value">{s.value}</span>
            <span className="t-meta">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

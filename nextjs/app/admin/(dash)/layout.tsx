import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/server';
import { isAllowedAdmin } from '@/lib/admin-auth';
import { signOut } from '../actions';

export const metadata = { title: 'Admin — T4 Labs' };

const NAV = [
  { href: '/admin', label: 'ภาพรวม' },
  { href: '/admin/projects', label: 'ผลงาน' },
  { href: '/admin/services', label: 'บริการ' },
  { href: '/admin/faqs', label: 'FAQ' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/conversations', label: 'แชท AI' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdmin(user.email, process.env.ADMIN_EMAILS)) {
    redirect('/admin/login');
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          <i />
          T4 Admin
        </div>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="admin-signout">
          <p className="t-meta">{user.email}</p>
          <button type="submit" className="btn ghost">
            ออกจากระบบ
          </button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

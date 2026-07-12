import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ Admin — T4 Labs' };

export default function AdminLoginPage() {
  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-brand">
          <i />
          T4 Admin
        </div>
        <h1>เข้าสู่ระบบ</h1>
        <p className="t-meta">สำหรับทีมงาน T4 Labs เท่านั้น</p>
        <LoginForm />
      </div>
    </div>
  );
}

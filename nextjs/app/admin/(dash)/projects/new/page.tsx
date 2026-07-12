import Link from 'next/link';
import { ProjectForm } from './project-form';

export default function NewProjectPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>เพิ่มผลงาน</h1>
        <Link href="/admin/projects" className="btn ghost">
          ← กลับ
        </Link>
      </div>
      <ProjectForm />
    </div>
  );
}

import { createClient } from '@/lib/server';

interface MessageRow {
  role: string;
  content: string;
  created_at: string;
}

export default async function AdminConversations() {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, session_id, language, created_at, messages(role, content, created_at)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="admin-page">
      <h1>บทสนทนา AI</h1>
      <p className="t-meta">Log การใช้งานผู้ช่วย AI (50 ล่าสุด)</p>
      {conversations && conversations.length > 0 ? (
        <div className="admin-convos">
          {conversations.map((c) => {
            const msgs = ((c.messages as MessageRow[]) ?? []).sort((a, b) =>
              a.created_at.localeCompare(b.created_at),
            );
            return (
              <details key={c.id} className="admin-convo">
                <summary>
                  <span className="t-meta">
                    {new Date(c.created_at).toLocaleString('th-TH')} · {c.language} ·{' '}
                    {msgs.length} ข้อความ
                  </span>
                </summary>
                <div className="admin-convo-body">
                  {msgs.map((m, i) => (
                    <div key={i} className={`admin-msg admin-msg-${m.role}`}>
                      <span className="t-meta">{m.role}</span>
                      <p>{m.content}</p>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        <p className="admin-empty">ยังไม่มีบทสนทนา</p>
      )}
    </div>
  );
}

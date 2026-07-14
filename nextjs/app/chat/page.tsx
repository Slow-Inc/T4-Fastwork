import type { Metadata } from 'next';
import { pageAlternates } from '@/lib/seo';
import { SiteNav } from '@/components/site/site-nav';
import { ChatWithProjectContext } from '@/components/chat/chat-with-project-context';

export const metadata: Metadata = {
  title: 'คุยกับผู้ช่วย AI — T4 Labs',
  description:
    'ผู้ช่วย AI ของ T4 Labs — เล่าโจทย์แล้วรับคำแนะนำเคสงานที่ใกล้เคียง พร้อมประเมินงบเบื้องต้น ตอบทั้งไทยและอังกฤษ',
  alternates: pageAlternates('/chat'),
};

export default function ChatPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page chat-page">
          <div className="chat-head">
            <span className="chat-head-idx">AI Assistant</span>
            <h1>คุยกับผู้ช่วย AI</h1>
          </div>
          <ChatWithProjectContext />
        </section>
      </div>
    </>
  );
}

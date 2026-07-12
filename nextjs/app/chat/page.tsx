import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { ChatClient } from '@/components/chat/chat-client';

export const metadata: Metadata = {
  title: 'คุยกับผู้ช่วย AI — T4 Labs',
  description:
    'ผู้ช่วย AI ของ T4 Labs — เล่าโจทย์แล้วรับคำแนะนำเคสงานที่ใกล้เคียง พร้อมประเมินงบเบื้องต้น ตอบทั้งไทยและอังกฤษ',
};

export default function ChatPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page chat-page">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'คุยกับ AI' }]} />
          <div className="page-head rv">
            <div className="t-idx">AI Assistant</div>
            <h1>คุยกับผู้ช่วย AI</h1>
            <p className="page-lead">
              เล่าโจทย์ของคุณ — ผู้ช่วย AI จะแนะนำเคสงานที่ใกล้เคียงจากผลงานจริง
              และช่วยประเมินเบื้องต้น
            </p>
          </div>
          <ChatClient />
        </section>
      </div>
    </>
  );
}

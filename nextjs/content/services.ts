/** Homepage service list (Requirement §4.5 / §4.1.6). */
export interface Service {
  no: string;
  title: string;
  description: string;
}

export const services: Service[] = [
  { no: '01', title: 'Landing Page', description: 'เว็บ launch โปรดักต์ เน้นเร็ว โหลดไว SEO ดี' },
  { no: '02', title: 'Web Application', description: 'ระบบซับซ้อน auth + realtime + dashboard' },
  { no: '03', title: 'SaaS Platform', description: 'multi-tenant · billing · analytics · สเกลใหญ่' },
  { no: '04', title: 'AI Product', description: 'chatbot · RAG · Document AI · automation' },
  { no: '05', title: 'Mobile App', description: 'Flutter / React Native — iOS + Android' },
];

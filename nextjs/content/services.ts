/** Homepage service list (Requirement §4.5 / §4.1.6). */
export interface Service {
  no: string;
  title: string;
  description: string;
  descriptionEn: string;
}

export const services: Service[] = [
  { no: '01', title: 'Landing Page', description: 'เว็บ launch โปรดักต์ เน้นเร็ว โหลดไว SEO ดี', descriptionEn: 'Launch sites — fast, light, SEO-ready' },
  { no: '02', title: 'Web Application', description: 'ระบบซับซ้อน auth + realtime + dashboard', descriptionEn: 'Complex systems — auth + realtime + dashboard' },
  { no: '03', title: 'SaaS Platform', description: 'multi-tenant · billing · analytics · สเกลใหญ่', descriptionEn: 'multi-tenant · billing · analytics · scale' },
  { no: '04', title: 'AI Product', description: 'chatbot · RAG · Document AI · automation', descriptionEn: 'chatbot · RAG · Document AI · automation' },
  { no: '05', title: 'Mobile App', description: 'Flutter / React Native — iOS + Android', descriptionEn: 'Flutter / React Native — iOS + Android' },
];

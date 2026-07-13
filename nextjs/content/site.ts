/** Static homepage content: metrics, process schematic, certificates. */

export interface Metric {
  value: string;
  label: string;
}
export const metrics: Metric[] = [
  { value: '5+', label: 'Years experience' },
  { value: '21+', label: 'Projects built' },
  { value: '7', label: 'AI & security certs' },
  { value: 'TH·EN', label: 'Bilingual delivery' },
];

// The real request path through a T4 Labs system (Requirement §4.1.7 / §14.11).
export interface ProcessNode {
  index: string;
  name: string;
  role: string;
}
export interface ProcessConn {
  label: string;
}
export const processNodes: ProcessNode[] = [
  { index: '01', name: 'Next.js', role: 'Client' },
  { index: '02', name: 'Cloudflare', role: 'Edge · WAF' },
  { index: '03', name: 'Nest.js', role: 'API' },
  { index: '04', name: 'Supabase', role: 'Postgres · pgvector' },
  { index: '05', name: 'LLM', role: 'AI · RAG' },
];
export const processConns: ProcessConn[] = [
  { label: 'HTTPS' },
  { label: 'route / cache' },
  { label: 'SQL' },
  { label: 'RAG · stream' },
];
export const processSteps = ['Discovery', 'Architecture', 'Build', 'Ship', 'Scale'];

// The real engineering SDLC the team runs on every project (Requirement §4.6).
export interface SdlcPhase {
  index: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}
export const sdlcPhases: SdlcPhase[] = [
  {
    index: '01',
    title: 'วิเคราะห์ความต้องการ (Requirement Analysis)',
    titleEn: 'Requirement Analysis',
    description:
      'เก็บ requirement จริงจากลูกค้า แปลงเป็น user story และประเมินขอบเขต/ความเสี่ยงทางเทคนิคก่อนเริ่มงาน',
    descriptionEn:
      'Gather real requirements, turn them into user stories, and assess scope and technical risk before work begins',
  },
  {
    index: '02',
    title: 'ออกแบบระบบ (Design & Architecture)',
    titleEn: 'Design & Architecture',
    description: 'ออกแบบสถาปัตยกรรม data model และ UI/UX ให้ชัดเจนก่อนลงมือเขียนโค้ดจริง',
    descriptionEn:
      'Design the system architecture, data model, and UI/UX clearly before writing real code',
  },
  {
    index: '03',
    title: 'พัฒนา (Development)',
    titleEn: 'Development',
    description:
      'พัฒนาแบบ Agile เป็นรอบสั้น ๆ เขียนเทสต์ก่อนโค้ด (TDD) สำหรับ logic ที่สำคัญ และรีวิวโค้ดทุก pull request',
    descriptionEn:
      'Build in short Agile iterations, test-first (TDD) for critical logic, and code review on every pull request',
  },
  {
    index: '04',
    title: 'ทดสอบ (Testing & QA)',
    titleEn: 'Testing & QA',
    description:
      'Unit test และ end-to-end test (Playwright) ก่อน merge ทุกครั้ง พร้อม UAT ร่วมกับลูกค้าก่อนส่งมอบ',
    descriptionEn:
      'Unit and end-to-end tests (Playwright) before every merge, plus UAT with the client before delivery',
  },
  {
    index: '05',
    title: 'ส่งขึ้นระบบจริง (Deployment)',
    titleEn: 'Deployment',
    description:
      'Deploy ผ่าน CI/CD ขึ้น staging ก่อนแล้วค่อยขึ้น production พร้อมแผน rollback หากเกิดปัญหา',
    descriptionEn:
      'Deploy via CI/CD to staging first, then production, with a rollback plan ready if something goes wrong',
  },
  {
    index: '06',
    title: 'ดูแลหลังส่งมอบ (Maintenance & Support)',
    titleEn: 'Maintenance & Support',
    description:
      'ติดตามการทำงานของระบบจริง แก้ไขบั๊ก และเพิ่มฟีเจอร์ตาม feedback ตามที่ตกลงกันไว้',
    descriptionEn: 'Monitor the live system, fix bugs, and add features based on feedback as agreed',
  },
];

export interface Certificate {
  issuer: string;
  title: string;
  titleEn?: string;
  issuerLogo?: string;
  issuedYear?: number;
  thumbnail?: string;
  fullImage?: string;
  verifyUrl?: string;
}
export const certificates: Certificate[] = [
  { issuer: 'NVIDIA', title: 'AI for All: From Basics to GenAI Practice' },
  { issuer: 'Coursera', title: 'GenAI for Application Developers' },
  { issuer: 'SET', title: 'Entrepreneurial Mindset' },
  { issuer: 'Microsoft · JA', title: 'Road to Data Scientists' },
  { issuer: 'SIIT · TU', title: 'Basic Data Analytics Workshop' },
  { issuer: 'TDGA', title: 'Cyber Security Awareness' },
  { issuer: 'TDGA', title: 'AI Governance & Ethics' },
];

// Education (from the team's Fastwork profile — kept in sync with it).
export interface EducationEntry {
  program: string;
  institution: string;
}
export const education: EducationEntry[] = [
  {
    program: 'เทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล (นานาชาติ)',
    institution: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ',
  },
  {
    program: 'คณิตศาสตร์เชิงวิทยาการคอมพิวเตอร์',
    institution: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ',
  },
  { program: 'วิทยาการคอมพิวเตอร์', institution: 'มหาวิทยาลัยกรุงเทพ' },
  { program: 'เทคโนโลยีสารสนเทศและนวัตกรรม', institution: 'มหาวิทยาลัยกรุงเทพ' },
];

// Skills (from the team's Fastwork profile — kept in sync with it).
export type SkillLevel = 'expert' | 'intermediate';
export interface Skill {
  name: string;
  detail?: string;
  level: SkillLevel;
}
export const skills: Skill[] = [
  { name: 'Next.js', detail: 'TypeScript, JavaScript, Tailwind, CSS, HTML', level: 'expert' },
  { name: 'Nest.js', detail: 'TypeScript', level: 'expert' },
  { name: 'React', detail: 'TypeScript, JavaScript, Tailwind, CSS, HTML', level: 'expert' },
  { name: 'Vue.js', detail: 'TypeScript, JavaScript, Tailwind, CSS, HTML', level: 'expert' },
  { name: 'AI Integration', detail: 'OCR, LLM, RAG, Chatbot, Document AI', level: 'expert' },
  { name: 'Cloudflare', detail: 'CDN, WAF, Tunnel, DNS, Zero Trust', level: 'expert' },
  { name: 'Payment Gateway', level: 'expert' },
  { name: 'Mobile App', detail: 'Flutter, React Native', level: 'expert' },
  { name: 'Cyber Security', level: 'intermediate' },
  { name: 'Discord Bot', detail: 'Discord.js, Lavalink, Management', level: 'expert' },
  {
    name: 'Supabase',
    detail: 'PostgreSQL, SMS/Email OTP, Database, Authentication, Realtime',
    level: 'expert',
  },
  {
    name: 'Firebase',
    detail: 'Firestore, SMS/Email OTP, Authentication, Cloud Messaging/FCM',
    level: 'expert',
  },
  { name: 'IoT', detail: 'MQTT', level: 'intermediate' },
  {
    name: 'Network & Routing',
    detail: 'Nginx, DNS, Load Balancing, API Gateway, Proxy, SSL/TLS, TCP/IP',
    level: 'expert',
  },
  { name: 'Real-time Protocols', detail: 'WebSocket, Socket.io, SSE', level: 'expert' },
  { name: 'UX/UI', detail: 'Figma', level: 'expert' },
  { name: 'MySQL', level: 'expert' },
  { name: 'MongoDB', level: 'expert' },
];

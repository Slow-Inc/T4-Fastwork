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

// The team (Requirement §4.6) — sourced from github.com/Slow-Inc's org README for
// names/roles, and individually from each member for education/skills/certs. Each
// person's own real data — nothing here is shared/merged across members.
export interface TeamCertificate {
  issuer: string;
  title: string;
}
export interface TeamMember {
  handle: string;
  githubUrl?: string;
  role: string;
  roleEn: string;
  /** Broad skill categories (not every member is a hands-on developer). */
  skills: string[];
  /** Detailed tech stack — omitted for non-technical roles. */
  stack?: string[];
  education?: { program: string; institution: string };
  certificates?: TeamCertificate[];
}
export const team: TeamMember[] = [
  {
    handle: 'Slowgers',
    githubUrl: 'https://github.com/Slowgers',
    role: 'Lead Developer & System Architect',
    roleEn: 'Lead Developer & System Architect',
    skills: ['Project Manager'],
    education: { program: 'วิทยาการคอมพิวเตอร์', institution: 'มหาวิทยาลัยกรุงเทพ (BU)' },
  },
  {
    handle: '_InI4',
    role: 'Vice Leader & Tester',
    roleEn: 'Vice Leader & Tester',
    skills: ['QA', 'Editor'],
    stack: [
      'Adobe Premiere Pro',
      'Adobe Photoshop',
      'Adobe Illustrator',
      'Adobe After Effects',
      'DaVinci Resolve',
      'Canva',
    ],
    education: {
      program: 'ภาพยนตร์และสื่อดิจิทัล',
      institution: 'มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)',
    },
  },
  {
    handle: 'xenodev',
    githubUrl: 'https://github.com/xenodeve',
    role: 'Full-Stack Developer & Bot Specialist',
    roleEn: 'Full-Stack Developer & Bot Specialist',
    skills: ['Tech Lead', 'Full-Stack', 'Infra', 'DevOps', 'UX/UI'],
    stack: [
      'Next.js',
      'Vite.js',
      'React.js',
      'Nest.js',
      'Express.js',
      'Vercel',
      'Radmin',
      'Tailscale',
      'Nginx',
      'Figma',
      'Cloudflare (CDN, DNS, Tunnel)',
      'MongoDB',
      'Supabase',
      'Firebase',
    ],
    education: {
      program: 'คณิตศาสตร์เชิงวิทยาการคอมพิวเตอร์',
      institution: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)',
    },
    certificates: [
      { issuer: 'NVIDIA', title: 'AI for All: From Basics to GenAI Practice' },
      { issuer: 'Microsoft · JA Thailand', title: 'Road to Data Scientists' },
      { issuer: 'SIIT · Thammasat University', title: 'Basic Data Analytics Workshop' },
      { issuer: "ToBeIT'67 · KMITL", title: 'เข้าสู่ไอทีลาดกระบัง' },
    ],
  },
  {
    handle: 'akkanop-x',
    githubUrl: 'https://github.com/akkanop-x',
    role: 'Full-Stack Developer & Cyber Security',
    roleEn: 'Full-Stack Developer & Cyber Security',
    skills: ['Infra', 'DevOps', 'Backend', 'Security'],
    stack: [
      'Cloudflare (CDN, DNS, WAF, Tunnel)',
      'Public Cloud (AWS, Azure, Google Cloud)',
      'Nest.js',
      'Express.js',
      'Fastify',
      'LINE OA',
      'Vercel',
      'Nginx',
      'Runpod',
      'Nmap',
      'Burp Suite',
      'Kali Linux',
      'VMware',
      'Radmin',
      'Tailscale',
      'MongoDB',
      'MySQL',
      'Supabase',
      'Firebase',
    ],
    education: {
      program: 'เทคโนโลยีสารสนเทศและนวัตกรรม',
      institution: 'มหาวิทยาลัยกรุงเทพ (BU)',
    },
  },
  {
    handle: "Thanathorn'Z",
    githubUrl: 'https://github.com/ThanathornZDev',
    role: 'Backend Developer & Game Developer',
    roleEn: 'Backend Developer & Game Developer',
    skills: ['Infra', 'Network', 'Backend', 'Security'],
    stack: [
      'Cloudflare (CDN, DNS, WAF, Tunnel)',
      'Public Cloud (AWS, Azure, Google Cloud)',
      'DNS',
      'DHCP',
      'Express.js',
      'LINE OA',
      'Vercel',
      'Nmap',
      'Burp Suite',
      'VMware',
      'Radmin',
      'Tailscale',
    ],
    education: { program: 'วิทยาการคอมพิวเตอร์', institution: 'มหาวิทยาลัยกรุงเทพ (BU)' },
    certificates: [
      { issuer: 'TDGA', title: 'Cyber Security Awareness' },
      { issuer: 'TDGA', title: 'AI Governance & Ethics' },
      { issuer: 'SET', title: 'Entrepreneurial Mindset' },
      { issuer: 'Coursera', title: 'GenAI for Application Developers' },
      { issuer: 'Speexx', title: 'English B1.2' },
    ],
  },
  {
    handle: 'Paradise',
    githubUrl: 'https://github.com/CableMoMo2027',
    role: 'Frontend Developer & Mobile Developer',
    roleEn: 'Frontend Developer & Mobile Developer',
    skills: ['Mobile App', 'Frontend', 'UX/UI'],
    stack: [
      'Flutter',
      'Nuxt.js',
      'Vue.js',
      'Next.js',
      'React.js',
      'Vite.js',
      'Vercel',
      'Figma',
      'MongoDB',
      'Firebase',
    ],
    education: {
      program: 'เทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล (นานาชาติ)',
      institution: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)',
    },
    certificates: [{ issuer: 'Microsoft · JA Thailand', title: 'Road to Data Scientists' }],
  },
];

/** Static homepage content: metrics, process schematic, certificates. */

export interface Metric {
  value: string;
  label: string;
}
/** The year T4's dev journey began (ม.3 / FiveM Lua scripting, 2019) — the anchor for
 * the "years experience" metric, computed live so it increments each year instead of
 * being a frozen number. Change this one fact if the real start year differs. */
export const EXPERIENCE_SINCE_YEAR = 2019;

export function experienceYears(sinceYear: number, currentYear: number): number {
  return Math.max(0, currentYear - sinceYear);
}

/** Build the hero metric band from live counts (projects/certs from the DB, years from
 * EXPERIENCE_SINCE_YEAR) — so the headline stats track real data, not a hardcode. */
export function metricsFromStats(stats: {
  years: number;
  projects: number;
  certs: number;
}): Metric[] {
  return [
    { value: `${stats.years}+`, label: 'Years experience' },
    { value: `${stats.projects}+`, label: 'Projects built' },
    { value: `${stats.certs}`, label: 'Certificates' },
    { value: 'TH·EN', label: 'Bilingual delivery' },
  ];
}

/** Static fallback (used when the DB is unreachable) — mirrors the live values. */
export const metrics: Metric[] = metricsFromStats({ years: 7, projects: 21, certs: 9 });

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
// person's own real data — nothing here is shared/merged across members. Projects are
// real audited GitHub repos; certificate assets are the real files under public/.
import { teamSlug } from '@/lib/team-slug';

export interface TeamProject {
  name: string;
  /** Real repo description (Thai/English as-is); '' when the repo has none. */
  description: string;
  url: string;
  tech: string[];
  year: number;
}
export interface TeamCertificateAsset {
  /** Display image (always present) — WebP, generated from the real file. */
  webp: string;
  /** Original PDF, if we have one (download). */
  pdf?: string;
  /** Original raster (png/jpg), if we have one (download). */
  img?: string;
}
export interface TeamCertificate {
  issuer: string;
  title: string;
  asset?: TeamCertificateAsset;
}
export interface TeamMember {
  handle: string;
  slug: string;
  githubUrl?: string;
  role: string;
  roleEn: string;
  /** Broad skill categories (not every member is a hands-on developer). */
  skills: string[];
  /** Detailed tech stack — omitted for non-technical roles. */
  stack?: string[];
  education?: { program: string; institution: string };
  certificates?: TeamCertificate[];
  /** Personal repos (real, audited via `gh repo view`). */
  projects?: TeamProject[];
  /** Whether to show the GitHub profile README on the public profile (Epic C / C3);
   * undefined (static members) is treated as visible. */
  readmeVisible?: boolean;
  /** Custom README markdown that replaces the live GitHub README when set (Epic C / C3). */
  readmeOverride?: string;
}

export const team: TeamMember[] = [
  {
    handle: 'Slowgers',
    slug: teamSlug('Slowgers'),
    githubUrl: 'https://github.com/Slowgers',
    role: 'Project Manager',
    roleEn: 'Project Manager',
    skills: ['Project Manager'],
    education: { program: 'วิทยาการคอมพิวเตอร์', institution: 'มหาวิทยาลัยกรุงเทพ (BU)' },
  },
  {
    handle: '_InI4',
    slug: teamSlug('_InI4'),
    role: 'Editor',
    roleEn: 'Editor',
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
    slug: teamSlug('xenodev'),
    githubUrl: 'https://github.com/xenodeve',
    role: 'Tech Lead',
    roleEn: 'Tech Lead',
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
      {
        issuer: 'NVIDIA',
        title: 'AI for All: From Basics to GenAI Practice',
        asset: {
          webp: '/certificates/xenodev/ai-for-all.webp',
          img: '/certificates/xenodev/ai-for-all.png',
          pdf: '/certificates/xenodev/ai-for-all.pdf',
        },
      },
      {
        issuer: 'Microsoft · JA Thailand',
        title: 'Road to Data Scientists',
        asset: {
          webp: '/certificates/xenodev/road-to-data-scientists.webp',
          img: '/certificates/xenodev/road-to-data-scientists.png',
          pdf: '/certificates/xenodev/road-to-data-scientists.pdf',
        },
      },
      {
        issuer: 'SIIT · Thammasat University',
        title: 'Basic Data Analytics Workshop',
        asset: {
          webp: '/certificates/xenodev/basic-data-analytics.webp',
          img: '/certificates/xenodev/basic-data-analytics.jpg',
        },
      },
      {
        issuer: "ToBeIT'67 · KMITL",
        title: 'เข้าสู่ไอทีลาดกระบัง',
        asset: {
          webp: '/certificates/xenodev/to-be-it-67.webp',
          img: '/certificates/xenodev/to-be-it-67.png',
        },
      },
    ],
    projects: [
      {
        name: 'resume_web',
        description:
          'เว็บพอร์ตโฟลิโอที่เชื่อมต่อ GitHub แบบเรียลไทม์ พร้อม Express backend สำหรับ cache และ Gemini 2.5 Flash สรุป focus areas',
        url: 'https://github.com/xenodeve/resume_web',
        tech: ['JavaScript', 'Express.js', 'Gemini API'],
        year: 2025,
      },
      {
        name: 'Hype-Macro_Store',
        description:
          'Full-stack e-commerce สำหรับสินค้า Gaming Mouse — React + TypeScript frontend, Nest.js + MongoDB backend',
        url: 'https://github.com/xenodeve/Hype-Macro_Store',
        tech: ['React.js', 'TypeScript', 'Nest.js', 'MongoDB'],
        year: 2025,
      },
      {
        name: 'Home-IoT-System',
        description:
          'ระบบควบคุม IoT เต็มรูปแบบ — Pico W (CircuitPython), Express.js, React และ MQTT ควบคุมจากระยะไกล',
        url: 'https://github.com/xenodeve/Home-IoT-System',
        tech: ['Python', 'Express.js', 'React.js', 'MQTT'],
        year: 2025,
      },
      {
        name: 'facedetection',
        description:
          'โปรแกรมตรวจจับใบหน้าด้วย OpenCV และ Python รองรับทั้งไฟล์ภาพ, URL และกล้องแบบ Real-time',
        url: 'https://github.com/xenodeve/facedetection',
        tech: ['Python', 'OpenCV'],
        year: 2025,
      },
      {
        name: 'narze',
        description: 'Discord Music Bot',
        url: 'https://github.com/xenodeve/narze',
        tech: ['TypeScript', 'JavaScript'],
        year: 2026,
      },
      {
        name: 'xeno-skills',
        description: 'Multi-agent manual-consensus brainstorm skill สำหรับ PAL clink (Claude Code)',
        url: 'https://github.com/xenodeve/xeno-skills',
        tech: ['Claude Code'],
        year: 2026,
      },
      {
        name: 'orangecat',
        description: 'Discord bot เช็คสตอร์ Valorant',
        url: 'https://github.com/xenodeve/orangecat',
        tech: ['Python', 'Docker'],
        year: 2023,
      },
    ],
  },
  {
    handle: 'akkanop-x',
    slug: teamSlug('akkanop-x'),
    githubUrl: 'https://github.com/akkanop-x',
    role: 'Backend, Infra',
    roleEn: 'Backend, Infra',
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
    projects: [
      {
        name: 'get-statement-kbiz',
        description: 'สคริปต์ดึง statement จาก KBIZ (จัดทำเพื่อการศึกษา)',
        url: 'https://github.com/akkanop-x/get-statement-kbiz',
        tech: ['Python'],
        year: 2024,
      },
    ],
  },
  {
    handle: "Thanathorn'Z",
    slug: teamSlug("Thanathorn'Z"),
    githubUrl: 'https://github.com/ThanathornZDev',
    role: 'Backend, Infra',
    roleEn: 'Backend, Infra',
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
      {
        issuer: 'TDGA',
        title: 'Cyber Security Awareness',
        asset: {
          webp: '/certificates/thanathornz/cyber-security-awareness.webp',
          pdf: '/certificates/thanathornz/cyber-security-awareness.pdf',
        },
      },
      {
        issuer: 'TDGA',
        title: 'AI Governance & Ethics',
        asset: {
          webp: '/certificates/thanathornz/ai-governance-ethics.webp',
          pdf: '/certificates/thanathornz/ai-governance-ethics.pdf',
        },
      },
      {
        issuer: 'SET',
        title: 'Entrepreneurial Mindset',
        asset: {
          webp: '/certificates/thanathornz/entrepreneurial-mindset.webp',
          pdf: '/certificates/thanathornz/entrepreneurial-mindset.pdf',
        },
      },
      {
        issuer: 'Coursera',
        title: 'GenAI for Application Developers',
        asset: {
          webp: '/certificates/thanathornz/genai-for-app-developers.webp',
          pdf: '/certificates/thanathornz/genai-for-app-developers.pdf',
        },
      },
      {
        issuer: 'Speexx',
        title: 'English B1.2',
        asset: {
          webp: '/certificates/thanathornz/english-b1-2.webp',
          pdf: '/certificates/thanathornz/english-b1-2.pdf',
        },
      },
    ],
    projects: [
      {
        name: 'LINE_OA_BOT',
        description: 'บอท LINE Official Account',
        url: 'https://github.com/ThanathornZDev/LINE_OA_BOT',
        tech: ['Python', 'LINE OA'],
        year: 2026,
      },
      {
        name: 'Java-GUI-Read-Write-Binary-Data-File',
        description: 'โปรแกรม Java GUI อ่าน/เขียนไฟล์ binary',
        url: 'https://github.com/ThanathornZDev/Java-GUI-Read-Write-Binary-Data-File',
        tech: ['Java'],
        year: 2025,
      },
    ],
  },
  {
    handle: 'Paradise',
    slug: teamSlug('Paradise'),
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
    certificates: [
      {
        issuer: 'Microsoft · JA Thailand',
        title: 'Road to Data Scientists',
        asset: {
          webp: '/certificates/paradise/road-to-data-scientists.webp',
          img: '/certificates/paradise/road-to-data-scientists.png',
          pdf: '/certificates/paradise/road-to-data-scientists.pdf',
        },
      },
    ],
    projects: [
      {
        name: 'TeachThrough',
        description: '',
        url: 'https://github.com/CableMoMo2027/TeachThrough',
        tech: ['Vue.js', 'TypeScript', 'PostgreSQL'],
        year: 2026,
      },
      {
        name: 'PopcornPlus',
        description: '',
        url: 'https://github.com/CableMoMo2027/PopcornPlus',
        tech: ['Flutter', 'Dart'],
        year: 2026,
      },
      {
        name: 'MoMo.Ecom',
        description: '',
        url: 'https://github.com/CableMoMo2027/MoMo.Ecom',
        tech: ['JavaScript', 'TypeScript'],
        year: 2026,
      },
      {
        name: 'NextSeatProject',
        description: '',
        url: 'https://github.com/CableMoMo2027/NextSeatProject',
        tech: ['JavaScript', 'TypeScript'],
        year: 2026,
      },
      {
        name: 'Todo_Dashboard.vue',
        description: '',
        url: 'https://github.com/CableMoMo2027/Todo_Dashboard.vue',
        tech: ['Vue.js', 'TypeScript'],
        year: 2026,
      },
      {
        name: 'Galleria_app',
        description: '',
        url: 'https://github.com/CableMoMo2027/Galleria_app',
        tech: ['Flutter', 'Dart'],
        year: 2025,
      },
      {
        name: 'Project_Flutter',
        description: '',
        url: 'https://github.com/CableMoMo2027/Project_Flutter',
        tech: ['Flutter', 'Dart'],
        year: 2025,
      },
    ],
  },
];

// Shared team repos under the Slow-Inc org — collaborative work, shown once (not
// duplicated per person). `contributors` are the real GitHub contributors (mapped to
// their display handles), from `gh api repos/<r>/contributors`.
export interface TeamOrgProject extends TeamProject {
  contributors: string[];
}
export const teamProjects: TeamOrgProject[] = [
  {
    name: 'MangaDock',
    description: 'เว็บไซต์อ่านมังงะพร้อมระบบแปลมังงะด้วย AI',
    url: 'https://github.com/Slow-Inc/MangaDock',
    tech: ['TypeScript', 'AI'],
    year: 2026,
    contributors: ['xenodev', 'akkanop-x'],
  },
  {
    name: 'Website_Prototype01_Frontend',
    description: 'เว็บไซต์ต้นแบบ (Frontend)',
    url: 'https://github.com/Slow-Inc/Website_Prototype01_Frontend',
    tech: ['JavaScript'],
    year: 2025,
    contributors: ['xenodev', 'Paradise'],
  },
  {
    name: 'Website_Prototype01_Backend',
    description: 'เว็บไซต์ต้นแบบ (Backend API)',
    url: 'https://github.com/Slow-Inc/Website_Prototype01_Backend',
    tech: ['TypeScript'],
    year: 2025,
    contributors: ['xenodev'],
  },
  {
    name: 'planet_management',
    description: 'Discord bot สำหรับจัดการเซิร์ฟเวอร์',
    url: 'https://github.com/Slow-Inc/planet_management',
    tech: ['JavaScript', 'Discord.js'],
    year: 2025,
    contributors: ['xenodev'],
  },
];

/**
 * Deduped, sorted union of every member's tech `stack` (members without a stack
 * contribute nothing). Feeds the home team tech-stack carousel (#44). Pure so the
 * derivation is unit-testable independently of the live `team` data.
 */
export function deriveTeamTechnologies(
  members: { stack?: string[] }[],
): string[] {
  return Array.from(new Set(members.flatMap((m) => m.stack ?? []))).sort();
}

/** The real team's tech union — the carousel's data source (swaps to DB in #46). */
export const teamTechnologies = deriveTeamTechnologies(team);

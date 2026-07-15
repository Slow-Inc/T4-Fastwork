/**
 * One-time migration seed (Epic C foundation): the per-member projects/certificates
 * and the collaborative team projects from `nextjs/content/site.ts` into their DB
 * tables (`member_projects`, `member_certificates`, `team_projects`). Idempotent —
 * clears then re-inserts. Members must already be seeded (`seed-members.ts`); rows
 * are keyed to a member by slug. Run: `bun src/database/seed-member-content.ts`.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

interface SeedProject {
  name: string;
  description: string;
  url: string;
  tech: string[];
  year: number;
}
interface SeedCertificate {
  issuer: string;
  title: string;
  webp?: string;
  pdf?: string;
  img?: string;
}

// Keyed by member slug (teamSlug of the handle).
const projectsBySlug: Record<string, SeedProject[]> = {
  xenodev: [
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
      description:
        'Multi-agent manual-consensus brainstorm skill สำหรับ PAL clink (Claude Code)',
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
  'akkanop-x': [
    {
      name: 'get-statement-kbiz',
      description: 'สคริปต์ดึง statement จาก KBIZ (จัดทำเพื่อการศึกษา)',
      url: 'https://github.com/akkanop-x/get-statement-kbiz',
      tech: ['Python'],
      year: 2024,
    },
  ],
  thanathornz: [
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
  paradise: [
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
};

const certificatesBySlug: Record<string, SeedCertificate[]> = {
  xenodev: [
    {
      issuer: 'NVIDIA',
      title: 'AI for All: From Basics to GenAI Practice',
      webp: '/certificates/xenodev/ai-for-all.webp',
      img: '/certificates/xenodev/ai-for-all.png',
      pdf: '/certificates/xenodev/ai-for-all.pdf',
    },
    {
      issuer: 'Microsoft · JA Thailand',
      title: 'Road to Data Scientists',
      webp: '/certificates/xenodev/road-to-data-scientists.webp',
      img: '/certificates/xenodev/road-to-data-scientists.png',
      pdf: '/certificates/xenodev/road-to-data-scientists.pdf',
    },
    {
      issuer: 'SIIT · Thammasat University',
      title: 'Basic Data Analytics Workshop',
      webp: '/certificates/xenodev/basic-data-analytics.webp',
      img: '/certificates/xenodev/basic-data-analytics.jpg',
    },
    {
      issuer: "ToBeIT'67 · KMITL",
      title: 'เข้าสู่ไอทีลาดกระบัง',
      webp: '/certificates/xenodev/to-be-it-67.webp',
      img: '/certificates/xenodev/to-be-it-67.png',
    },
  ],
  thanathornz: [
    {
      issuer: 'TDGA',
      title: 'Cyber Security Awareness',
      webp: '/certificates/thanathornz/cyber-security-awareness.webp',
      pdf: '/certificates/thanathornz/cyber-security-awareness.pdf',
    },
    {
      issuer: 'TDGA',
      title: 'AI Governance & Ethics',
      webp: '/certificates/thanathornz/ai-governance-ethics.webp',
      pdf: '/certificates/thanathornz/ai-governance-ethics.pdf',
    },
    {
      issuer: 'SET',
      title: 'Entrepreneurial Mindset',
      webp: '/certificates/thanathornz/entrepreneurial-mindset.webp',
      pdf: '/certificates/thanathornz/entrepreneurial-mindset.pdf',
    },
    {
      issuer: 'Coursera',
      title: 'GenAI for Application Developers',
      webp: '/certificates/thanathornz/genai-for-app-developers.webp',
      pdf: '/certificates/thanathornz/genai-for-app-developers.pdf',
    },
    {
      issuer: 'Speexx',
      title: 'English B1.2',
      webp: '/certificates/thanathornz/english-b1-2.webp',
      pdf: '/certificates/thanathornz/english-b1-2.pdf',
    },
  ],
  paradise: [
    {
      issuer: 'Microsoft · JA Thailand',
      title: 'Road to Data Scientists',
      webp: '/certificates/paradise/road-to-data-scientists.webp',
      img: '/certificates/paradise/road-to-data-scientists.png',
      pdf: '/certificates/paradise/road-to-data-scientists.pdf',
    },
  ],
};

interface SeedTeamProject extends SeedProject {
  contributors: string[];
}
const teamProjects: SeedTeamProject[] = [
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

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  await db.delete(schema.memberProjects);
  await db.delete(schema.memberCertificates);
  await db.delete(schema.teamProjects);

  const rows = await db
    .select({ id: schema.members.id, slug: schema.members.slug })
    .from(schema.members);
  const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));

  let projectCount = 0;
  for (const [slug, projects] of Object.entries(projectsBySlug)) {
    const memberId = idBySlug.get(slug);
    if (!memberId) throw new Error(`no member row for slug "${slug}"`);
    await db.insert(schema.memberProjects).values(
      projects.map((p, i) => ({
        memberId,
        name: p.name,
        description: p.description,
        url: p.url,
        tech: p.tech,
        year: p.year,
        sortOrder: i,
      })),
    );
    projectCount += projects.length;
  }

  let certCount = 0;
  for (const [slug, certs] of Object.entries(certificatesBySlug)) {
    const memberId = idBySlug.get(slug);
    if (!memberId) throw new Error(`no member row for slug "${slug}"`);
    await db.insert(schema.memberCertificates).values(
      certs.map((c, i) => ({
        memberId,
        issuer: c.issuer,
        title: c.title,
        assetWebp: c.webp ?? null,
        assetPdf: c.pdf ?? null,
        assetImg: c.img ?? null,
        sortOrder: i,
      })),
    );
    certCount += certs.length;
  }

  await db.insert(schema.teamProjects).values(
    teamProjects.map((p, i) => ({
      name: p.name,
      description: p.description,
      url: p.url,
      tech: p.tech,
      year: p.year,
      contributors: p.contributors,
      sortOrder: i,
    })),
  );

  console.log(
    `seeded ${projectCount} member projects, ${certCount} member certificates, ${teamProjects.length} team projects`,
  );
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

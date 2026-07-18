/**
 * One-time migration seed: the team profiles from `nextjs/content/site.ts` into
 * the `members` table (Epic C / C1). Idempotent — clears then re-inserts. The DB
 * becomes the source of truth; the static array stays only as the read fallback.
 * Slugs match `teamSlug()` (lowercase, strip leading `_`, drop non-alnum).
 * Run: `bun src/database/seed-members.ts` (needs DATABASE_URL).
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type Edu = { program: string; institution: string };
interface SeedMember {
  handle: string;
  slug: string;
  githubUrl: string | null;
  role: string;
  roleEn: string;
  skills: string[];
  stack: string[];
  education: Edu;
}

const members: SeedMember[] = [
  {
    handle: 'Slowgers',
    slug: 'slowgers',
    githubUrl: 'https://github.com/Slowgers',
    role: 'Project Manager',
    roleEn: 'Project Manager',
    skills: ['Project Manager'],
    stack: [],
    education: {
      program: 'วิทยาการคอมพิวเตอร์',
      institution: 'มหาวิทยาลัยกรุงเทพ (BU)',
    },
  },
  {
    handle: '_InI4',
    slug: 'ini4',
    githubUrl: null,
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
    slug: 'xenodev',
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
  },
  {
    handle: 'akkanop-x',
    slug: 'akkanop-x',
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
      program: 'วิทยาการข้อมูลและความมั่นคงปลอดภัยไซเบอร์',
      institution: 'คณะเทคโนโลยีสารสนเทศและนวัตกรรม มหาวิทยาลัยกรุงเทพ (BU)',
    },
  },
  {
    handle: "Thanathorn'Z",
    slug: 'thanathornz',
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
    education: {
      program: 'วิทยาการคอมพิวเตอร์',
      institution: 'มหาวิทยาลัยกรุงเทพ (BU)',
    },
  },
  {
    handle: 'Paradise',
    slug: 'paradise',
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
  },
];

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  await db.delete(schema.members);
  await db.insert(schema.members).values(
    members.map((m, i) => ({
      handle: m.handle,
      slug: m.slug,
      githubUrl: m.githubUrl,
      githubLogin: m.githubUrl
        ? m.githubUrl.replace(/.*\//, '').toLowerCase()
        : null,
      role: m.role,
      roleEn: m.roleEn,
      skills: m.skills,
      stack: m.stack,
      education: m.education,
      sortOrder: i,
    })),
  );
  console.log(`seeded ${members.length} members`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

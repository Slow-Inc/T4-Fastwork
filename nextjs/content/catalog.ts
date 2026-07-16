/**
 * Project catalog — the source of truth for /projects (list + filter) and
 * /projects/[slug] (detail). Mirrors Requirement §6.1 (Project data model).
 * MangaDock is the real flagship (matches the backend seed); the rest are
 * curated T4 Labs work. This static layer stands in for the DB-backed list
 * until the CMS/API path replaces it — same shape, so the swap is mechanical.
 */
export interface Project {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn?: string;
  /** Full rich description, one paragraph per entry. */
  content: string[];
  category: string;
  tags: string[];
  technologies: string[];
  liveUrl?: string;
  videoUrl?: string;
  /** Cover image URL (e.g. uploaded via the CMS); falls back to a tone tile. */
  snapshotImage?: string;
  isFeatured: boolean;
  /** Visual tone for the snapshot placeholder (reuses the homepage palette). */
  tone: 'ink' | 'sand' | 'teal' | 'gray';
  year: string;
  /** GitHub repo backing this project (spec 2026-07-14) — enables the live
   * detail overlay (stars, contributors, README). Absent for non-GitHub work. */
  github?: { owner: string; repo: string };
  /** Whose project: the org (team) or a member (personal). */
  ownerType?: 'team' | 'personal';
  ownerLabel?: string;
}

export const projects: Project[] = [
  {
    slug: 'mangadock',
    title: 'MangaDock',
    titleEn: 'MangaDock',
    description:
      'แพลตฟอร์มอ่าน/แปลมังงะด้วย AI — OCR ข้อความในภาพ แปล และประกอบกลับแบบอัตโนมัติ',
    descriptionEn:
      'AI manga reading/translation — OCR in-image text, translate, and recompose automatically',
    content: [
      'MangaDock เป็นแพลตฟอร์มแปลมังงะอัตโนมัติที่รวม OCR, การแปลด้วย LLM และการประกอบข้อความกลับเข้าเฟรมภาพต้นฉบับไว้ใน pipeline เดียว',
      'ระบบหลังบ้านออกแบบให้รองรับงานปริมาณมากแบบ batch พร้อมคิวประมวลผลและการแคชผลลัพธ์ เพื่อให้ต้นทุนต่อหน้าต่ำและสเกลได้',
      'ส่วนหน้าเว็บเป็น reader ที่ลื่นไหล รองรับการอ่านต่อเนื่องและการสลับภาษาต้นฉบับ/ปลายทาง',
    ],
    category: 'AI/Automation',
    tags: ['RAG', 'OCR', 'Realtime'],
    technologies: ['Next.js', 'Nest.js', 'Supabase', 'pgvector'],
    liveUrl: 'https://hayateotsu.space',
    isFeatured: true,
    tone: 'teal',
    year: '2025',
    github: { owner: 'Slow-Inc', repo: 'MangaDock' },
    ownerType: 'team',
    ownerLabel: 'T4 Labs',
  },
  {
    slug: 'listingthai',
    title: 'ListingThai',
    titleEn: 'ListingThai',
    description: 'มาร์เก็ตเพลสอสังหาริมทรัพย์ — ค้นหา กรอง และลงประกาศพร้อมแดชบอร์ดเอเจนต์',
    descriptionEn: 'Property marketplace — search, filter and list with an agent dashboard',
    content: [
      'ListingThai เป็นมาร์เก็ตเพลสอสังหาฯ ที่รวมประกาศจากหลายเอเจนต์ พร้อมระบบค้นหา/กรองที่ deep-linkable และแผนที่',
      'มีแดชบอร์ดสำหรับเอเจนต์จัดการประกาศ รูปภาพ และสถิติการเข้าชม',
    ],
    category: 'Marketplace',
    tags: ['Dashboard', 'Payment'],
    technologies: ['Next.js', 'React', 'Supabase', 'Tailwind'],
    liveUrl: 'https://listingthai.com',
    isFeatured: true,
    tone: 'ink',
    year: '2024',
  },
  {
    slug: 'powernics',
    title: 'Powernics',
    titleEn: 'Powernics',
    description: 'แพลตฟอร์มติดตามระบบโซลาร์ — มอนิเตอร์การผลิตไฟฟ้าแบบเรียลไทม์และรายงาน',
    descriptionEn: 'Solar monitoring platform — real-time generation tracking and reports',
    content: [
      'Powernics เป็นแพลตฟอร์ม SaaS สำหรับติดตามระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ รวมข้อมูลจากอินเวอร์เตอร์หลายยี่ห้อไว้ในที่เดียว',
      'มีแดชบอร์ดเรียลไทม์ กราฟแนวโน้มการผลิต และรายงานสรุปตามช่วงเวลาแบบ export ได้',
    ],
    category: 'SaaS',
    tags: ['Dashboard', 'Realtime'],
    technologies: ['React', 'Node.js', 'Supabase'],
    isFeatured: true,
    tone: 'gray',
    year: '2024',
  },
  {
    slug: 'ghost-maps',
    title: 'The Ghost Maps',
    titleEn: 'The Ghost Maps',
    description: 'แอปสำรวจสถานที่แบบเรียลไทม์ — พิกัด รีวิว และการแชร์ตำแหน่งสด',
    descriptionEn: 'Real-time places app — pins, reviews and live location sharing',
    content: [
      'The Ghost Maps เป็นเว็บแอปค้นหาและแชร์สถานที่แบบเรียลไทม์ พร้อมระบบรีวิวและพิกัดสด',
      'ใช้ Supabase Realtime สำหรับการอัปเดตตำแหน่งและความเห็นแบบทันที',
    ],
    category: 'Web App',
    tags: ['Realtime', 'LINE OA'],
    technologies: ['Next.js', 'Supabase', 'Tailwind'],
    isFeatured: false,
    tone: 'sand',
    year: '2025',
  },
  {
    slug: 'clinic-flow',
    title: 'ClinicFlow',
    titleEn: 'ClinicFlow',
    description: 'ระบบจองคิวและจัดการคลินิก — นัดหมาย เวชระเบียน และแจ้งเตือนผ่าน LINE',
    descriptionEn: 'Clinic booking & management — appointments, records and LINE reminders',
    content: [
      'ClinicFlow เป็นระบบจัดการคลินิกครบวงจร ตั้งแต่การจองคิวออนไลน์ เวชระเบียน ไปจนถึงการแจ้งเตือนผู้ป่วยผ่าน LINE OA',
      'ออกแบบสิทธิ์การเข้าถึงหลายระดับ (หมอ/พยาบาล/แอดมิน) และรองรับหลายสาขา',
    ],
    category: 'Booking',
    tags: ['LINE OA', 'Dashboard'],
    technologies: ['Next.js', 'Nest.js', 'MySQL'],
    isFeatured: false,
    tone: 'ink',
    year: '2024',
  },
  {
    slug: 'stockpilot',
    title: 'StockPilot',
    titleEn: 'StockPilot',
    description: 'ระบบจัดการสต็อกและคลังสินค้าภายในองค์กร — CRUD, บาร์โค้ด และรายงาน',
    descriptionEn: 'Internal stock & warehouse system — CRUD, barcodes and reports',
    content: [
      'StockPilot เป็นระบบภายในสำหรับจัดการสต็อกและคลังสินค้า รองรับการสแกนบาร์โค้ด นับสต็อก และรายงานเคลื่อนไหว',
      'เชื่อมต่อกับระบบบัญชีเดิมขององค์กรผ่าน REST API',
    ],
    category: 'Internal Tool',
    tags: ['Dashboard', 'Payment'],
    technologies: ['React', 'Nest.js', 'MySQL'],
    isFeatured: false,
    tone: 'gray',
    year: '2023',
  },
  {
    slug: 'docai-extract',
    title: 'DocAI Extract',
    titleEn: 'DocAI Extract',
    description: 'บริการดึงข้อมูลจากเอกสารด้วย AI — OCR ใบเสร็จ/สัญญา และส่งออกแบบมีโครงสร้าง',
    descriptionEn: 'AI document extraction — OCR receipts/contracts into structured output',
    content: [
      'DocAI Extract เป็นบริการ Document AI ที่ดึงข้อมูลจากเอกสารสแกน (ใบเสร็จ สัญญา แบบฟอร์ม) แล้วส่งออกเป็นข้อมูลมีโครงสร้าง',
      'ใช้ pipeline OCR + LLM ตรวจสอบความถูกต้อง และมี webhook ส่งผลลัพธ์กลับระบบลูกค้า',
    ],
    category: 'AI/Automation',
    tags: ['OCR', 'RAG'],
    technologies: ['Nest.js', 'Supabase', 'pgvector'],
    isFeatured: false,
    tone: 'teal',
    year: '2025',
  },
  {
    slug: 'eduportal',
    title: 'EduPortal',
    titleEn: 'EduPortal',
    description: 'แพลตฟอร์มการเรียนออนไลน์แบบ multi-tenant — คอร์ส วิดีโอ และการชำระเงิน',
    descriptionEn: 'Multi-tenant e-learning platform — courses, video and payments',
    content: [
      'EduPortal เป็นแพลตฟอร์ม SaaS การเรียนออนไลน์แบบ multi-tenant ให้สถาบันสร้างพื้นที่เรียนของตัวเองได้',
      'รองรับระบบสมาชิก/subscription การสตรีมวิดีโอ และการชำระเงินผ่าน payment gateway',
    ],
    category: 'SaaS',
    tags: ['Payment', 'Dashboard'],
    technologies: ['Next.js', 'Nest.js', 'Supabase', 'Tailwind'],
    isFeatured: false,
    tone: 'sand',
    year: '2023',
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export interface ProjectFilter {
  q?: string;
  category?: string;
  tag?: string;
  tech?: string;
  featured?: boolean;
}

/** Filter an arbitrary project list (used for both the static catalog and the
 * DB-merged list on /projects). */
export function filterProjectList(list: Project[], filter: ProjectFilter): Project[] {
  const q = filter.q?.trim().toLowerCase();
  const tech = filter.tech?.trim().toLowerCase();
  return list.filter((p) => {
    if (filter.featured && !p.isFeatured) return false;
    if (filter.category && p.category !== filter.category) return false;
    if (filter.tag && !p.tags.includes(filter.tag)) return false;
    if (tech && !p.technologies.some((t) => t.toLowerCase() === tech)) return false;
    if (q) {
      const haystack = `${p.title} ${p.titleEn} ${p.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function filterProjects(filter: ProjectFilter): Project[] {
  return filterProjectList(projects, filter);
}

const uniqSorted = (xs: string[]) => Array.from(new Set(xs)).sort();

/** Facets derived from an arbitrary project list. */
export function facetsFor(list: Project[]) {
  return {
    categories: uniqSorted(list.map((p) => p.category).filter(Boolean)),
    technologies: uniqSorted(list.flatMap((p) => p.technologies)),
    tags: uniqSorted(list.flatMap((p) => p.tags)),
  };
}

const uniq = (xs: string[]) => Array.from(new Set(xs));

export const projectCategories = uniq(projects.map((p) => p.category)).sort();
export const projectTechnologies = uniq(
  projects.flatMap((p) => p.technologies),
).sort();
export const projectTags = uniq(projects.flatMap((p) => p.tags)).sort();

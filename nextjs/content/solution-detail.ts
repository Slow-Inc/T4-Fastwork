/**
 * Content for the solution landing template (/recommend/[type], Requirement
 * §4.4). Per-type hero + value props + which portfolio category to feature.
 * The Feature Checklist (§4.4.2) and Interactive Preview screens (§4.4.1) are
 * shared across every type.
 */
export interface ValueProp {
  title: string;
  desc: string;
}

export interface SolutionDetail {
  slug: string;
  badge: string;
  headline: string;
  tagline: string;
  valueProps: ValueProp[];
  /** Catalog category to feature; undefined → show featured work. */
  portfolioCategory?: string;
}

const SHARED_VALUE_PROPS: ValueProp[] = [
  { title: 'ตรงกับ workflow จริง', desc: 'ระบบออกแบบตามกระบวนการทำงานจริงของธุรกิจ ไม่ใช่ template สำเร็จรูป' },
  { title: 'เห็นข้อมูลรวมหน้าจอเดียว', desc: 'Dashboard และรายงาน real-time รวมข้อมูลสำคัญไว้ที่เดียว' },
  { title: 'สิทธิ์หลายระดับ', desc: 'แต่ละคนเห็นเฉพาะส่วนที่ควรเห็น ปลอดภัยและควบคุมได้' },
  { title: 'เชื่อมต่อระบบเดิม', desc: 'ผสานกับ ERP, CRM, LINE และระบบที่มีอยู่ได้' },
];

const details: Record<string, SolutionDetail> = {
  saas: {
    slug: 'saas',
    badge: 'SaaS Platform',
    headline: 'สร้าง SaaS ที่สเกลได้ตั้งแต่วันแรก',
    tagline: 'multi-tenant, ระบบ subscription/บิลลิ่ง, admin & analytics รองรับผู้ใช้จำนวนมาก',
    valueProps: SHARED_VALUE_PROPS,
    portfolioCategory: 'SaaS',
  },
  webapp: {
    slug: 'webapp',
    badge: 'Web Application',
    headline: 'เว็บแอปพลิเคชันที่ซับซ้อนแต่ลื่นไหล',
    tagline: 'marketplace, booking, dashboard, internal tools พร้อม auth + realtime',
    valueProps: SHARED_VALUE_PROPS,
    portfolioCategory: 'Web App',
  },
  'ai-product': {
    slug: 'ai-product',
    badge: 'AI Product',
    headline: 'AI Product ที่ใช้งานได้จริง ไม่ใช่แค่ demo',
    tagline: 'chatbot, RAG, OCR/Document AI และ automation ที่ผสานเข้ากับ product',
    valueProps: SHARED_VALUE_PROPS,
    portfolioCategory: 'AI/Automation',
  },
  mvp: {
    slug: 'mvp',
    badge: 'MVP for Startup',
    headline: 'MVP ที่พร้อม launch และระดมทุน',
    tagline: 'สร้างเร็ว โฟกัสฟีเจอร์หลัก เพื่อทดสอบตลาดและนำเสนอนักลงทุน',
    valueProps: SHARED_VALUE_PROPS,
  },
  'internal-system': {
    slug: 'internal-system',
    badge: 'Internal System',
    headline: 'ระบบหลังบ้านที่ทีมคุณใช้งานได้จริง',
    tagline: 'automation, integration, API และ dashboard สำหรับงานภายในองค์กร',
    valueProps: SHARED_VALUE_PROPS,
    portfolioCategory: 'Internal Tool',
  },
  other: {
    slug: 'other',
    badge: 'ปรึกษาโจทย์เฉพาะ',
    headline: 'มีโจทย์เฉพาะ? คุยกับเราได้',
    tagline: 'ไม่แน่ใจว่างานของคุณเข้าประเภทไหน — เล่ามาได้เลย เราช่วยหาทางออก',
    valueProps: SHARED_VALUE_PROPS,
  },
};

export function getSolutionDetail(slug: string): SolutionDetail | undefined {
  return details[slug];
}

export const solutionSlugs = Object.keys(details);

/** Feature Checklist — 6 groups (Requirement §4.4.2). */
export interface FeatureGroup {
  title: string;
  items: string[];
}

export const featureGroups: FeatureGroup[] = [
  {
    title: 'Authentication และสิทธิ์',
    items: [
      'Login / Register / Forgot Password',
      'Login ด้วย Social (Google, LINE, Facebook)',
      'Role-Based Access (Admin / Staff / User / Agent)',
      'Two-Factor Authentication (2FA)',
      'Session Management / Logout ทุกอุปกรณ์',
      'Audit Log บันทึกว่าใครทำอะไรเมื่อไหร่',
    ],
  },
  {
    title: 'Dashboard และรายงาน',
    items: [
      'Dashboard สรุป KPI ตามต้องการ',
      'กราฟ / Chart แบบ interactive',
      'รายงาน real-time หรือตามช่วงเวลา',
      'กรอง / Drill-down ข้อมูลได้ลึก',
      'Export Excel / PDF / CSV',
      'ส่งรายงานอัตโนมัติทาง Email (scheduled)',
    ],
  },
  {
    title: 'จัดการข้อมูล (CRUD)',
    items: [
      'เพิ่ม / แก้ไข / ลบ / ค้นหา',
      'Import จาก Excel / CSV',
      'Bulk action หลายรายการพร้อมกัน',
      'Soft Delete / กู้คืนข้อมูล',
      'ประวัติการแก้ไข (version control)',
      'ระบบ Approval / อนุมัติหลายขั้น',
    ],
  },
  {
    title: 'การเชื่อมต่อและ Integration',
    items: [
      'REST API ให้ระบบอื่น call ได้',
      'เชื่อมต่อ LINE OA / LINE Notify',
      'ส่ง SMS แจ้งเตือน',
      'เชื่อมต่อ ERP / SAP / ระบบเดิม',
      'Payment Gateway (Omise, Stripe, 2C2P)',
      'Webhook รับ-ส่งข้อมูลกับระบบภายนอก',
    ],
  },
  {
    title: 'Upload ไฟล์และสื่อ',
    items: [
      'อัปโหลดรูป / วิดีโอ / PDF',
      'Resize / Compress รูปอัตโนมัติ',
      'จัดการไฟล์แบบ Folder / Library',
      'ควบคุมสิทธิ์เข้าถึงไฟล์ต่อ Role',
    ],
  },
  {
    title: 'Performance และ Security',
    items: [
      'Caching เพื่อความเร็ว',
      'Rate Limiting กัน abuse',
      'HTTPS / SSL ทุก endpoint',
      'Data Validation ทั้ง frontend และ backend',
      'Backup อัตโนมัติรายวัน',
      'Scalable รองรับผู้ใช้พร้อมกันจำนวนมาก',
    ],
  },
];

/** Interactive Preview — 9 example screens (Requirement §4.4.1). */
export interface PreviewScreen {
  title: string;
  roles: string;
  description: string;
  components: string[];
}

export const previewScreens: PreviewScreen[] = [
  { title: 'Login / Auth', roles: 'ทุกคน', description: 'Login Email/Password หรือ Social พร้อม Forgot Password + 2FA', components: ['ช่องอีเมล/รหัสผ่าน', 'ปุ่มเข้าสู่ระบบ', 'Social login', 'ลืมรหัสผ่าน', 'ยืนยัน 2FA'] },
  { title: 'Notification', roles: 'ทุกคน', description: 'รายการแจ้งเตือน กรองตามประเภท อ่าน/ยังไม่อ่าน + ตั้งค่า', components: ['ตัวกรองประเภท', 'รายการแจ้งเตือน', 'สถานะอ่าน/ยังไม่อ่าน', 'ตั้งค่าการแจ้งเตือน'] },
  { title: 'Dashboard หลัก', roles: 'Admin / User', description: 'ภาพรวมข้อมูลหลัก', components: ['การ์ด KPI', 'กราฟแนวโน้ม', 'ตารางล่าสุด', 'shortcut เมนู'] },
  { title: 'จัดการข้อมูล (CRUD)', roles: 'Admin / Staff', description: 'เพิ่ม/แก้/ลบ/ค้นหาข้อมูล', components: ['ค้นหา/กรอง', 'ปุ่มเพิ่ม', 'ตารางข้อมูล', 'bulk action', 'pagination'] },
  { title: 'รายงาน (Report)', roles: 'Admin / Manager', description: 'สรุปข้อมูลเป็นกราฟ + export', components: ['ตัวกรองช่วงเวลา', 'กราฟ Bar/Line', 'กราฟ Pie', 'Export Excel/PDF'] },
  { title: 'Audit Log / ประวัติ', roles: 'Admin', description: 'ประวัติกิจกรรมในระบบ', components: ['ค้นหา/กรอง', 'ไทม์ไลน์', 'ผู้ใช้ & เวลา', 'ประเภท action'] },
  { title: 'ตั้งค่าระบบ (Settings)', roles: 'Admin', description: 'ตั้งค่าระบบตามหมวด', components: ['เมนูหมวด', 'ฟอร์มตั้งค่า', 'สวิตช์เปิด/ปิด', 'ปุ่มบันทึก'] },
  { title: 'API & Integration', roles: 'Admin', description: 'จัดการ API keys + webhook', components: ['รายการ API Keys', 'สถานะ Webhook', 'คัดลอก/รีเซ็ต', 'log การเชื่อมต่อ'] },
  { title: 'จัดการผู้ใช้ (User Mgmt)', roles: 'Admin', description: 'จัดการบัญชี + สิทธิ์', components: ['ค้นหา', 'ตารางผู้ใช้', 'กำหนด Role/สิทธิ์', 'เปิด/ปิด account'] },
];

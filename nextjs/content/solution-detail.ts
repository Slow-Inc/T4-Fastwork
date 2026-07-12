/**
 * Content for the solution landing template (/recommend/[type], Requirement
 * §4.4), bilingual (§7.1). Per-type hero + value props + which portfolio
 * category to feature. Feature Checklist (§4.4.2) and Interactive Preview
 * screens (§4.4.1) are shared across every type.
 */
export interface ValueProp {
  title: string;
  desc: string;
  titleEn: string;
  descEn: string;
}

export interface SolutionDetail {
  slug: string;
  badge: string;
  badgeEn: string;
  headline: string;
  headlineEn: string;
  tagline: string;
  taglineEn: string;
  valueProps: ValueProp[];
  /** Catalog category to feature; undefined → show featured work. */
  portfolioCategory?: string;
}

const SHARED_VALUE_PROPS: ValueProp[] = [
  { title: 'ตรงกับ workflow จริง', desc: 'ระบบออกแบบตามกระบวนการทำงานจริงของธุรกิจ ไม่ใช่ template สำเร็จรูป', titleEn: 'Fits your real workflow', descEn: 'Built around how the business actually works — not an off-the-shelf template' },
  { title: 'เห็นข้อมูลรวมหน้าจอเดียว', desc: 'Dashboard และรายงาน real-time รวมข้อมูลสำคัญไว้ที่เดียว', titleEn: 'Everything on one screen', descEn: 'Real-time dashboards and reports bring key data together in one place' },
  { title: 'สิทธิ์หลายระดับ', desc: 'แต่ละคนเห็นเฉพาะส่วนที่ควรเห็น ปลอดภัยและควบคุมได้', titleEn: 'Multi-level permissions', descEn: 'Everyone sees only what they should — secure and controllable' },
  { title: 'เชื่อมต่อระบบเดิม', desc: 'ผสานกับ ERP, CRM, LINE และระบบที่มีอยู่ได้', titleEn: 'Connects to your systems', descEn: 'Integrates with ERP, CRM, LINE and your existing tools' },
];

const details: Record<string, SolutionDetail> = {
  saas: {
    slug: 'saas', badge: 'SaaS Platform', badgeEn: 'SaaS Platform',
    headline: 'สร้าง SaaS ที่สเกลได้ตั้งแต่วันแรก', headlineEn: 'Build a SaaS that scales from day one',
    tagline: 'multi-tenant, ระบบ subscription/บิลลิ่ง, admin & analytics รองรับผู้ใช้จำนวนมาก',
    taglineEn: 'multi-tenant, subscription/billing, admin & analytics for many users',
    valueProps: SHARED_VALUE_PROPS, portfolioCategory: 'SaaS',
  },
  webapp: {
    slug: 'webapp', badge: 'Web Application', badgeEn: 'Web Application',
    headline: 'เว็บแอปพลิเคชันที่ซับซ้อนแต่ลื่นไหล', headlineEn: 'Complex web apps that still feel effortless',
    tagline: 'marketplace, booking, dashboard, internal tools พร้อม auth + realtime',
    taglineEn: 'marketplace, booking, dashboards, internal tools with auth + realtime',
    valueProps: SHARED_VALUE_PROPS, portfolioCategory: 'Web App',
  },
  'ai-product': {
    slug: 'ai-product', badge: 'AI Product', badgeEn: 'AI Product',
    headline: 'AI Product ที่ใช้งานได้จริง ไม่ใช่แค่ demo', headlineEn: 'AI products that work in production, not just demos',
    tagline: 'chatbot, RAG, OCR/Document AI และ automation ที่ผสานเข้ากับ product',
    taglineEn: 'chatbot, RAG, OCR/Document AI and automation woven into your product',
    valueProps: SHARED_VALUE_PROPS, portfolioCategory: 'AI/Automation',
  },
  mvp: {
    slug: 'mvp', badge: 'MVP for Startup', badgeEn: 'MVP for Startup',
    headline: 'MVP ที่พร้อม launch และระดมทุน', headlineEn: 'An MVP ready to launch and raise',
    tagline: 'สร้างเร็ว โฟกัสฟีเจอร์หลัก เพื่อทดสอบตลาดและนำเสนอนักลงทุน',
    taglineEn: 'Ship fast, focus on the core, validate the market and pitch investors',
    valueProps: SHARED_VALUE_PROPS,
  },
  'internal-system': {
    slug: 'internal-system', badge: 'Internal System', badgeEn: 'Internal System',
    headline: 'ระบบหลังบ้านที่ทีมคุณใช้งานได้จริง', headlineEn: 'Back-office systems your team actually uses',
    tagline: 'automation, integration, API และ dashboard สำหรับงานภายในองค์กร',
    taglineEn: 'automation, integration, API and dashboards for internal operations',
    valueProps: SHARED_VALUE_PROPS, portfolioCategory: 'Internal Tool',
  },
  other: {
    slug: 'other', badge: 'ปรึกษาโจทย์เฉพาะ', badgeEn: 'Custom brief',
    headline: 'มีโจทย์เฉพาะ? คุยกับเราได้', headlineEn: 'Got a specific challenge? Let’s talk',
    tagline: 'ไม่แน่ใจว่างานของคุณเข้าประเภทไหน — เล่ามาได้เลย เราช่วยหาทางออก',
    taglineEn: 'Not sure which category fits — tell us and we’ll find the path',
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
  titleEn: string;
  items: string[];
  itemsEn: string[];
}

export const featureGroups: FeatureGroup[] = [
  {
    title: 'Authentication และสิทธิ์', titleEn: 'Authentication & access',
    items: ['Login / Register / Forgot Password', 'Login ด้วย Social (Google, LINE, Facebook)', 'Role-Based Access (Admin / Staff / User / Agent)', 'Two-Factor Authentication (2FA)', 'Session Management / Logout ทุกอุปกรณ์', 'Audit Log บันทึกว่าใครทำอะไรเมื่อไหร่'],
    itemsEn: ['Login / Register / Forgot Password', 'Social login (Google, LINE, Facebook)', 'Role-Based Access (Admin / Staff / User / Agent)', 'Two-Factor Authentication (2FA)', 'Session management / log out everywhere', 'Audit log of who did what, when'],
  },
  {
    title: 'Dashboard และรายงาน', titleEn: 'Dashboards & reporting',
    items: ['Dashboard สรุป KPI ตามต้องการ', 'กราฟ / Chart แบบ interactive', 'รายงาน real-time หรือตามช่วงเวลา', 'กรอง / Drill-down ข้อมูลได้ลึก', 'Export Excel / PDF / CSV', 'ส่งรายงานอัตโนมัติทาง Email (scheduled)'],
    itemsEn: ['Custom KPI dashboards', 'Interactive charts', 'Real-time or period reports', 'Deep filter / drill-down', 'Export to Excel / PDF / CSV', 'Scheduled email reports'],
  },
  {
    title: 'จัดการข้อมูล (CRUD)', titleEn: 'Data management (CRUD)',
    items: ['เพิ่ม / แก้ไข / ลบ / ค้นหา', 'Import จาก Excel / CSV', 'Bulk action หลายรายการพร้อมกัน', 'Soft Delete / กู้คืนข้อมูล', 'ประวัติการแก้ไข (version control)', 'ระบบ Approval / อนุมัติหลายขั้น'],
    itemsEn: ['Create / edit / delete / search', 'Import from Excel / CSV', 'Bulk actions', 'Soft delete / restore', 'Edit history (version control)', 'Multi-step approval flows'],
  },
  {
    title: 'การเชื่อมต่อและ Integration', titleEn: 'Connectivity & integration',
    items: ['REST API ให้ระบบอื่น call ได้', 'เชื่อมต่อ LINE OA / LINE Notify', 'ส่ง SMS แจ้งเตือน', 'เชื่อมต่อ ERP / SAP / ระบบเดิม', 'Payment Gateway (Omise, Stripe, 2C2P)', 'Webhook รับ-ส่งข้อมูลกับระบบภายนอก'],
    itemsEn: ['REST API for other systems', 'LINE OA / LINE Notify', 'SMS notifications', 'ERP / SAP / legacy integration', 'Payment gateways (Omise, Stripe, 2C2P)', 'Webhooks in/out to external systems'],
  },
  {
    title: 'Upload ไฟล์และสื่อ', titleEn: 'File & media upload',
    items: ['อัปโหลดรูป / วิดีโอ / PDF', 'Resize / Compress รูปอัตโนมัติ', 'จัดการไฟล์แบบ Folder / Library', 'ควบคุมสิทธิ์เข้าถึงไฟล์ต่อ Role'],
    itemsEn: ['Upload images / video / PDF', 'Auto resize / compress images', 'Folder / library file management', 'Per-role file access control'],
  },
  {
    title: 'Performance และ Security', titleEn: 'Performance & security',
    items: ['Caching เพื่อความเร็ว', 'Rate Limiting กัน abuse', 'HTTPS / SSL ทุก endpoint', 'Data Validation ทั้ง frontend และ backend', 'Backup อัตโนมัติรายวัน', 'Scalable รองรับผู้ใช้พร้อมกันจำนวนมาก'],
    itemsEn: ['Caching for speed', 'Rate limiting against abuse', 'HTTPS / SSL on every endpoint', 'Validation on front and back end', 'Daily automated backups', 'Scalable to many concurrent users'],
  },
];

/** Interactive Preview — 9 example screens (Requirement §4.4.1). */
export interface PreviewScreen {
  title: string;
  titleEn: string;
  roles: string;
  description: string;
  descriptionEn: string;
  components: string[];
  componentsEn: string[];
}

export const previewScreens: PreviewScreen[] = [
  { title: 'Login / Auth', titleEn: 'Login / Auth', roles: 'ทุกคน', description: 'Login Email/Password หรือ Social พร้อม Forgot Password + 2FA', descriptionEn: 'Email/password or social login with forgot password + 2FA', components: ['ช่องอีเมล/รหัสผ่าน', 'ปุ่มเข้าสู่ระบบ', 'Social login', 'ลืมรหัสผ่าน', 'ยืนยัน 2FA'], componentsEn: ['Email/password fields', 'Sign-in button', 'Social login', 'Forgot password', '2FA verification'] },
  { title: 'Notification', titleEn: 'Notification', roles: 'ทุกคน', description: 'รายการแจ้งเตือน กรองตามประเภท อ่าน/ยังไม่อ่าน + ตั้งค่า', descriptionEn: 'Notifications list, filter by type, read/unread + settings', components: ['ตัวกรองประเภท', 'รายการแจ้งเตือน', 'สถานะอ่าน/ยังไม่อ่าน', 'ตั้งค่าการแจ้งเตือน'], componentsEn: ['Type filter', 'Notification list', 'Read/unread status', 'Notification settings'] },
  { title: 'Dashboard หลัก', titleEn: 'Main dashboard', roles: 'Admin / User', description: 'ภาพรวมข้อมูลหลัก', descriptionEn: 'Overview of the key data', components: ['การ์ด KPI', 'กราฟแนวโน้ม', 'ตารางล่าสุด', 'shortcut เมนู'], componentsEn: ['KPI cards', 'Trend charts', 'Recent table', 'Menu shortcuts'] },
  { title: 'จัดการข้อมูล (CRUD)', titleEn: 'Data management (CRUD)', roles: 'Admin / Staff', description: 'เพิ่ม/แก้/ลบ/ค้นหาข้อมูล', descriptionEn: 'Create/edit/delete/search data', components: ['ค้นหา/กรอง', 'ปุ่มเพิ่ม', 'ตารางข้อมูล', 'bulk action', 'pagination'], componentsEn: ['Search/filter', 'Add button', 'Data table', 'Bulk action', 'Pagination'] },
  { title: 'รายงาน (Report)', titleEn: 'Reports', roles: 'Admin / Manager', description: 'สรุปข้อมูลเป็นกราฟ + export', descriptionEn: 'Data summarized in charts + export', components: ['ตัวกรองช่วงเวลา', 'กราฟ Bar/Line', 'กราฟ Pie', 'Export Excel/PDF'], componentsEn: ['Date-range filter', 'Bar/line charts', 'Pie chart', 'Export Excel/PDF'] },
  { title: 'Audit Log / ประวัติ', titleEn: 'Audit log / history', roles: 'Admin', description: 'ประวัติกิจกรรมในระบบ', descriptionEn: 'Activity history across the system', components: ['ค้นหา/กรอง', 'ไทม์ไลน์', 'ผู้ใช้ & เวลา', 'ประเภท action'], componentsEn: ['Search/filter', 'Timeline', 'User & time', 'Action type'] },
  { title: 'ตั้งค่าระบบ (Settings)', titleEn: 'System settings', roles: 'Admin', description: 'ตั้งค่าระบบตามหมวด', descriptionEn: 'Configure the system by category', components: ['เมนูหมวด', 'ฟอร์มตั้งค่า', 'สวิตช์เปิด/ปิด', 'ปุ่มบันทึก'], componentsEn: ['Category menu', 'Settings form', 'Toggles', 'Save button'] },
  { title: 'API & Integration', titleEn: 'API & integration', roles: 'Admin', description: 'จัดการ API keys + webhook', descriptionEn: 'Manage API keys + webhooks', components: ['รายการ API Keys', 'สถานะ Webhook', 'คัดลอก/รีเซ็ต', 'log การเชื่อมต่อ'], componentsEn: ['API key list', 'Webhook status', 'Copy/reset', 'Connection log'] },
  { title: 'จัดการผู้ใช้ (User Mgmt)', titleEn: 'User management', roles: 'Admin', description: 'จัดการบัญชี + สิทธิ์', descriptionEn: 'Manage accounts + permissions', components: ['ค้นหา', 'ตารางผู้ใช้', 'กำหนด Role/สิทธิ์', 'เปิด/ปิด account'], componentsEn: ['Search', 'User table', 'Assign role/permissions', 'Enable/disable account'] },
];

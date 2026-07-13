# Requirement Document — เว็บไซต์เอเจนซี / พอร์ตโฟลิโอ (สไตล์ Bigzweb)

> เอกสารความต้องการสำหรับพัฒนาเว็บไซต์รับทำเว็บ/เอเจนซี พร้อมระบบโชว์ผลงานและผู้ช่วย AI แนะนำงาน
> **Tech stack เป้าหมาย:** Framework สมัยใหม่ (Next.js + Backend/DB)
> เวอร์ชัน 1.0 · สำหรับใช้เป็น spec ตั้งต้นในการพัฒนาเอง

---

## 1. ภาพรวมโปรเจกต์ (Project Overview)

### 1.1 วัตถุประสงค์
เว็บไซต์สำหรับทีมพัฒนาซอฟต์แวร์ (T4 Labs) ที่รับสร้าง **SaaS, Web Application และ AI Product** ให้กับ startup และองค์กร โดยวางตัวเป็นพาร์ตเนอร์ด้านเทคนิคระดับพรีเมียม ไม่ใช่ร้านรับทำเว็บทั่วไป เป้าหมายหลักคือ

- สื่อสาร positioning ว่าเป็น **product engineering partner** ที่รับได้ครบสเปกตรัม — ตั้งแต่ Landing Page ทั่วไป ไปจนถึงระบบ/แพลตฟอร์มที่ซับซ้อนสูง สเกลใหญ่ เสถียร รองรับผู้ใช้จำนวนมาก
- นำเสนอความเชี่ยวชาญเชิงลึก (Full-Stack + AI) ให้ดูน่าเชื่อถือด้วยผลงาน + ใบรับรอง (social proof)
- โชว์ผลงาน (portfolio) แบบมีหมวดหมู่ ค้นหาและกรองตามเทคโนโลยีได้
- มีผู้ช่วย AI (chatbot) ช่วยคุยโจทย์ทางเทคนิคและแนะนำเคสงานที่ใกล้เคียง
- แปลง traffic เป็น qualified lead → นัดคุย/ส่งบรีฟ → ช่องทางจ้างงาน (Fastwork หรือฟอร์ม/นัดหมาย)

### 1.2 กลุ่มเป้าหมาย (Target Audience)
กลุ่มเป้าหมายหลักเป็น B2B / decision-maker สายเทคโนโลยี:

- **Founder / Startup** — ต้องการสร้าง MVP หรือ product จริงเพื่อ launch/ระดมทุน
- **SME / บริษัท** ที่ต้องการ digital transformation หรือระบบภายในที่ปรับแต่งเอง
- องค์กรที่ต้องการ **SaaS platform** (multi-tenant, subscription, dashboard)
- ธุรกิจที่ต้องการ **Web Application** ระบบซับซ้อน (marketplace, booking, internal tools)
- ธุรกิจที่ต้องการ **AI Product** (chatbot, RAG, OCR/Document AI, automation)

**Persona ที่ต้องโน้มน้าว:** Founder/CTO/Product Owner ที่มองหาความน่าเชื่อถือทางเทคนิค (stack, ความปลอดภัย, สเกล, ประสบการณ์) มากกว่าราคาถูกที่สุด — เนื้อหาและ tone ต้องพูดภาษาเดียวกับคนสายเทค

### 1.3 เป้าหมายเชิงธุรกิจ (Business Goals / KPI)
- เพิ่มจำนวนการติดต่อ/จ้างงาน (conversion rate ของปุ่ม "ติดต่อ/จ้างงาน")
- เพิ่มเวลาเฉลี่ยบนหน้าเว็บ และจำนวนหน้า/เซสชัน
- อัตราการใช้งาน AI chat ต่อผู้เข้าชม
- อันดับ SEO สำหรับคีย์เวิร์ด "รับทำเว็บไซต์" และคำที่เกี่ยวข้อง

---

## 2. ขอบเขตงาน (Scope)

### 2.1 อยู่ในขอบเขต (In Scope)
- เว็บไซต์แบบ responsive (mobile-first) รองรับ 2 ภาษา (TH/EN)
- ระบบจัดการผลงาน (Projects) พร้อมหมวดหมู่, tag, เทคโนโลยีที่ใช้
- ระบบผู้ช่วย AI แนะนำผลงาน (chat)
- ระบบบทความ/บล็อก (Blog) เพื่อ SEO
- หน้า Static: เกี่ยวกับเรา, บริการ, FAQ, แนวทางราคา, พันธมิตร
- Admin/CMS สำหรับจัดการเนื้อหาผลงานและบทความ
- SEO, Open Graph, structured data, sitemap
- Analytics และ tracking การคลิกปุ่มติดต่อ

### 2.2 อยู่นอกขอบเขต (Out of Scope) — เฟสถัดไป
- ระบบชำระเงิน/ตะกร้าสินค้าบนเว็บนี้เอง (ใช้ platform ภายนอกจ้างงาน)
- ระบบสมาชิก/ล็อกอินสำหรับลูกค้าทั่วไป
- ระบบเปิดใบเสนอราคาอัตโนมัติแบบเต็ม (มีเฉพาะฟอร์มขอ)

---

## 3. โครงสร้างหน้าเว็บ (Sitemap)

```
/                      หน้าแรก (Landing)
/projects              รวมผลงานทั้งหมด (มี filter หมวด/เทคโนโลยี)
/projects/[slug]       รายละเอียดผลงานรายชิ้น
/recommend/[type]      หน้าแนะนำตามโจทย์ (saas, webapp, ai-product, mvp, internal-system, other)
/chat                  ผู้ช่วย AI แบบเต็มหน้า
/services (#services)  รายละเอียดบริการ
/about                 เกี่ยวกับเรา
/faq                   คำถามที่พบบ่อย
/pricing-guide         แนวทางราคา
/blog                  รวมบทความ
/blog/[slug]           บทความรายชิ้น
/bw (partners)         พันธมิตร
/lang/th, /lang/en     สลับภาษา
/sitemap.xml, /robots.txt
```

---

## 4. รายละเอียดหน้าเว็บ (Page Requirements)

### 4.1 หน้าแรก (Landing Page)
เรียงลำดับ section จากบนลงล่าง:

1. **Header / Navbar (sticky)**
   - โลโก้ + เมนู: หน้าแรก, ผลงาน, AI, บริการ, เกี่ยวกับเรา, FAQ, บทความ
   - ตัวสลับภาษา TH/EN
   - ช่องค้นหา
   - ปุ่ม CTA "ติดต่อเรา" เด่นชัด
   - เมนู hamburger บนมือถือ

2. **Hero Section**
   - หัวข้อหลัก + ประโยคขาย(value proposition)
   - ปุ่ม CTA คู่: "ติดต่อ/จ้างงาน" และ "คุยกับ AI"
   - แถบตัวเลขความน่าเชื่อถือ: ประสบการณ์ 5 ปี, ส่งมอบ 500+ โปรเจกต์, เชี่ยวชาญงานระบบ
   - (ออปชัน) องค์ประกอบ interactive เช่น มินิเกม/แอนิเมชัน

3. **ตัวเลือกโจทย์ (Solution Selector)** — ปรับให้ตรงกับกลุ่มเป้าหมายสายเทค
   - การ์ด 6 โจทย์:
     - **SaaS Platform** (multi-tenant, subscription, dashboard)
     - **Web Application** (ระบบซับซ้อน, marketplace, internal tools)
     - **AI Product** (chatbot, RAG, OCR/Document AI, automation)
     - **MVP for Startup** (สร้างเร็ว launch/ระดมทุน)
     - **Internal System / Automation** (ระบบหลังบ้าน, integration)
     - **อื่นๆ / ปรึกษาโจทย์เฉพาะ**
   - แต่ละการ์ดลิงก์ไป `/recommend/[type]`
   - ปุ่ม "ไม่แน่ใจ คุยโจทย์กับ AI"

4. **ผลงานแนะนำ (Featured Projects)** — carousel เลื่อนได้ แสดง project ที่ตั้ง featured

5. **ผลงานของเรา (Projects Grid)**
   - แท็บกรองตามหมวด: ทั้งหมด, เว็บแอป, อสังหาฯ, ขายสินค้า, ก่อสร้าง, เทคโนโลยี, บริษัท
   - การ์ดผลงาน: ภาพ snapshot, ชื่อ, หมวด, badge (แนะนำ/VDO), ปุ่มดูตัวอย่าง + ลิงก์รายละเอียด
   - ปุ่ม "ดูผลงานทั้งหมด"

6. **บริการของเรา (Services)** — บริการไล่ระดับ (ดูข้อ 4.5)

7. **How we build (Process / System Thinking)** — visual สื่อกระบวนการคิด/ออกแบบระบบ สร้างด้วย CSS/Typography/Grid/Line/Label (schematic ของ data flow จริง: Client → Edge → API → Data/pgvector → LLM) + ขั้นตอนทำงาน Discovery→Architecture→Build→Ship→Scale — **ห้ามใช้ภาพ stock / dashboard mockup เจเนอริก**

8. **เทคโนโลยีและเฟรมเวิร์ก (Tech Stack)** — แสดง tag เทคโนโลยี คลิกแล้วกรองผลงานที่ใช้ tech นั้น (`/projects?tech=React`)

9. **CTA ปิดท้าย** — "พร้อมเริ่มโปรเจกต์แล้วหรือยัง?" + ปุ่มจ้างงาน + จุดสร้างความมั่นใจ (มีรีวิว, ตอบเร็ว)

10. **Footer** — เมนูซ้ำ, ลิงก์เพิ่ม (พันธมิตร, แนวทางราคา), ลิขสิทธิ์, **ลิงก์นโยบายความเป็นส่วนตัว/ข้อกำหนด**, ใช้ **reCAPTCHA v3**

> **Global component เพิ่มเติม:** **Breadcrumb** (แสดงลำดับหน้า เช่น หน้าแรก › หมวด › หน้าปัจจุบัน) บนหน้า `/projects`, `/blog`, solution landing และหน้า detail

11. **Widget AI ลอย (Floating AI)** — ปุ่มแชตมุมจอ, มี quick-reply, เชิญชวน "พาชมเว็บ"

### 4.2 หน้ารวมผลงาน (`/projects`)
โครงสร้าง: Breadcrumb → (ออปชัน) Solution selector 6 การ์ด + ปุ่มถาม AI → แถบกรอง → กริดผลงาน → Pagination

**ระบบกรอง (Filter) 3 แกน + ค้นหา** — sync กับ query string ทั้งหมด (deep-linkable):
- **ค้นหาคำสำคัญ** — ช่อง search + ปุ่มค้นหา/ล้าง (`?q=`)
- **หมวดหมู่ (Category)** — หลายหมวด เช่น SaaS, Web App, AI/Automation, Marketplace, Booking, Internal Tool, Platform ฯลฯ (`?category=`)
- **แท็ก (Tags)** — คีย์เวิร์ดเฉพาะงาน เช่น LINE OA, RAG, OCR, Payment, Realtime, Dashboard (`?tag=`)
- **เทคโนโลยี (Technology)** — เช่น Next.js, Nest.js, React, Supabase, Tailwind, MySQL, Node.js, Laravel (`?tech=`)
- **Tab สลับ** "ทั้งหมด / โปรเจกต์แนะนำ (Featured)"

**การ์ดผลงานแต่ละใบ:** badge (VDO / แนะนำ / หมวด) · ปุ่ม "ดูตัวอย่าง" · ชื่อ · คำอธิบายสั้น · tags · ปุ่ม "ดูรายละเอียด" · ลิงก์เปิดเว็บจริง (tab ใหม่)

**Pagination:** แสดง ~12 ต่อหน้า (ปรับได้), มีเลขหน้า; รองรับทั้ง pagination หรือ infinite scroll
- โครง data รองรับผลงานจำนวนมาก (อ้างอิง Bigzweb ~113 ผลงาน) — index/ค้นหาต้องเร็ว

### 4.3 หน้ารายละเอียดผลงาน (`/projects/[slug]`)
ต้องมี:
- ภาพปก/แกลเลอรี snapshot + วิดีโอ (ถ้ามี)
- ชื่อโปรเจกต์, คำอธิบาย, หมวดหมู่, tag
- เทคโนโลยีที่ใช้ (chips)
- ลิงก์ดูเว็บจริง (เปิด tab ใหม่, rel="noopener")
- ปุ่ม "คุยกับ AI ดูงานคล้ายกัน" และ "ติดต่อจ้างงาน"
- Meta/OG เฉพาะหน้า (title, description, og:image = snapshot)
- โครงสร้าง JSON-LD (CreativeWork / SoftwareApplication)

### 4.4 หน้าแนะนำตามโจทย์ / Solution Landing (`/recommend/[type]`)
- รับ type: `saas | webapp | ai-product | mvp | internal-system | other`
- เป็น **landing page เต็มรูปแบบต่อโจทย์** (เหมาะยิงโฆษณา/SEO แยก) — ทุกโจทย์ใช้ template เดียวกัน ต่างที่เนื้อหา/ผลงาน โครง (anatomy):
  1. **Hero** เฉพาะโจทย์ — ป้ายหมวด + headline + tagline + **CTA 3 ปุ่ม:** คุยกับ AI/ประเมินราคา · ติดต่อผ่าน Fastwork · ดูผลงานที่เคยทำ
  2. **Value Proposition** — การ์ด 4 ใบ ("โจทย์นี้ช่วยธุรกิจอย่างไร"): (1) ระบบตรงกับ workflow จริงของธุรกิจ (2) เห็นข้อมูลสำคัญรวมหน้าจอเดียว (dashboard/รายงาน real-time) (3) ระบบสิทธิ์หลายระดับ แต่ละคนเห็นเฉพาะส่วนที่ควรเห็น (4) เชื่อมต่อระบบเดิม (ERP, CRM, LINE)
  3. **Portfolio Highlight** — คำโปรย + ปุ่ม "ดูผลงานทั้งหมด" + การ์ดผลงานเด่น 3 ชิ้น
  4. **Interactive Preview** — พรีวิวตัวอย่างงาน 9 หน้าแบบกดดูได้ (ดูข้อ 4.4.1)
  5. **Feature Checklist (Accordion 6 กลุ่ม)** — ดูข้อ 4.4.2
  6. **Portfolio Grid (ในหมวด)** — คำโปรย + จำนวนโปรเจกต์ + การ์ดผลงาน + ปุ่ม "ดูทั้งหมด"
  7. **CTA** — ติดต่อ Fastwork (รับใบเสนอราคา/คุยทีมตรง) + คุยกับ AI (ถามรายละเอียด/ประเมินราคา)
  8. **Category / Solution Navigation Footer** — ลิงก์ไปโจทย์อื่น (SaaS · Web App · AI Product · MVP · Internal System · อื่นๆ)

### 4.4.1 Interactive Preview (Component ตัวอย่างระบบ)
Component แบบกดดูได้ ฝังใน solution landing (ข้อ 4.4) — ให้ลูกค้า **กดดูตัวอย่างหน้าจอระบบจริงก่อนจ้าง** เพื่อสร้างความมั่นใจในความสามารถ

**การควบคุม/มุมมอง:**
- **2 มุมมอง (tab):** "หน้าฝั่งลูกค้า" / "หน้าฝั่ง Admin" — ใช้รายการหน้า + คำอธิบายชุดเดียวกัน ต่างที่ภาพ mockup
- **เลือกสไตล์ได้ 3 แบบ** (style variant ของ mockup)
- ผู้ใช้กดเลื่อนดูได้ครบ (อ้างอิง ~9 หน้าตัวอย่าง)

**ต่อหนึ่งหน้าตัวอย่าง ต้องเตรียมข้อมูล 4 อย่าง:** ชื่อหน้า · ระดับผู้ใช้ (Role) ที่เข้าถึง · คำอธิบายสั้น 1 บรรทัด · รายการ UI components (+ ภาพ mockup ต่อมุมมอง/สไตล์)

**9 หน้าตัวอย่าง:**

| # | หน้า | Role | คำอธิบาย | UI Components |
|---|------|------|----------|--------------|
| 1 | Login / Auth | ทุกคน | Login Email/Password หรือ Social พร้อม Forgot Password + 2FA | ช่องอีเมล/รหัสผ่าน · ปุ่มเข้าสู่ระบบ · Social login · ลืมรหัสผ่าน · ยืนยัน 2FA |
| 2 | Notification | ทุกคน | รายการแจ้งเตือน กรองตามประเภท อ่าน/ยังไม่อ่าน + ตั้งค่า | ตัวกรองประเภท · รายการแจ้งเตือน · สถานะอ่าน/ยังไม่อ่าน · ตั้งค่าการแจ้งเตือน |
| 3 | Dashboard หลัก | Admin/User | ภาพรวมข้อมูลหลัก | การ์ด KPI · กราฟแนวโน้ม · ตารางล่าสุด · shortcut เมนู |
| 4 | จัดการข้อมูล (CRUD) | Admin/Staff | เพิ่ม/แก้/ลบ/ค้นหาข้อมูล | ค้นหา/กรอง · ปุ่มเพิ่ม · ตารางข้อมูล · bulk action · pagination |
| 5 | รายงาน (Report) | Admin/Manager | สรุปข้อมูลเป็นกราฟ + export | ตัวกรองช่วงเวลา · กราฟ Bar/Line · กราฟ Pie · Export Excel/PDF |
| 6 | Audit Log / ประวัติ | Admin | ประวัติกิจกรรมในระบบ | ค้นหา/กรอง · ไทม์ไลน์ · ผู้ใช้ & เวลา · ประเภท action |
| 7 | ตั้งค่าระบบ (Settings) | Admin | ตั้งค่าระบบตามหมวด | เมนูหมวด · ฟอร์มตั้งค่า · สวิตช์เปิด/ปิด · ปุ่มบันทึก (ทั่วไป · แจ้งเตือน · ความปลอดภัย · API Keys · สำรองข้อมูล) |
| 8 | API & Integration | Admin | จัดการ API keys + webhook | รายการ API Keys (Production/Test/Mobile) · สถานะ Webhook · คัดลอก/รีเซ็ต · log การเชื่อมต่อ |
| 9 | จัดการผู้ใช้ (User Mgmt) | Admin | จัดการบัญชี + สิทธิ์ | ค้นหา · ตารางผู้ใช้ (ผู้ใช้ · Role · สถานะ) · กำหนด Role/สิทธิ์ · เปิด/ปิด account |

### 4.4.2 Feature Checklist (Accordion 6 กลุ่ม)
ฝังใน solution landing — คำโปรย: "รายการคือแนวทาง ใช้เลือก scope ก่อนคุย" (ช่วยลูกค้าเลือกฟีเจอร์ก่อนขอใบเสนอราคา)

**1. Authentication และสิทธิ์**
- Login / Register / Forgot Password
- Login ด้วย Social (Google, LINE, Facebook)
- Role-Based Access (Admin / Staff / User / Agent)
- Two-Factor Authentication (2FA)
- Session Management / Logout ทุกอุปกรณ์
- Audit Log บันทึกว่าใครทำอะไรเมื่อไหร่

**2. Dashboard และรายงาน**
- Dashboard สรุป KPI ตามต้องการ
- กราฟ / Chart แบบ interactive
- รายงาน real-time หรือตามช่วงเวลา
- กรอง / Drill-down ข้อมูลได้ลึก
- Export Excel / PDF / CSV
- ส่งรายงานอัตโนมัติทาง Email (scheduled)

**3. จัดการข้อมูล (CRUD)**
- เพิ่ม / แก้ไข / ลบ / ค้นหา
- Import จาก Excel / CSV
- Bulk action หลายรายการพร้อมกัน
- Soft Delete / กู้คืนข้อมูล
- ประวัติการแก้ไข (version control)
- ระบบ Approval / อนุมัติหลายขั้น

**4. การเชื่อมต่อและ Integration**
- REST API ให้ระบบอื่น call ได้
- เชื่อมต่อ LINE OA / LINE Notify
- ส่ง SMS แจ้งเตือน
- เชื่อมต่อ ERP / SAP / ระบบเดิม
- Payment Gateway (Omise, Stripe, 2C2P)
- Cloud Storage (S3, Google Drive)
- Webhook รับ-ส่งข้อมูลกับระบบภายนอก

**5. Upload ไฟล์และสื่อ**
- อัปโหลดรูป / วิดีโอ / PDF
- Resize / Compress รูปอัตโนมัติ
- จัดการไฟล์แบบ Folder / Library
- ควบคุมสิทธิ์เข้าถึงไฟล์ต่อ Role

**6. Performance และ Security**
- Caching เพื่อความเร็ว
- Rate Limiting กัน abuse
- HTTPS / SSL ทุก endpoint
- Data Validation ทั้ง frontend และ backend
- Backup อัตโนมัติรายวัน
- Scalable รองรับผู้ใช้พร้อมกันจำนวนมาก

> รายการนี้เป็นฟีเจอร์ระบบทั่วไปที่ทีมทำได้ (แสดงความสามารถ) — dev เลือกใช้/ตัดตามแต่ละโปรเจกต์

### 4.5 หน้า/section บริการ
สื่อสารว่าทีมรับงาน **ครบสเปกตรัม — ตั้งแต่ Landing Page ทั่วไป ไปจนถึง Platform ที่ซับซ้อนสูง** (แนะนำมี visual ไล่ระดับความซับซ้อน/สเกลของงาน)

แต่ละบริการมี: ชื่อ, กลุ่มที่เหมาะ, สิ่งที่ส่งมอบ, stack ที่ใช้, ปุ่ม "ปรึกษาเรา" + "ถาม AI ดูเคสงาน"

1. **Landing Page / Marketing Site** — เว็บ launch โปรดักต์/แคมเปญ เน้นเร็ว สวย โหลดไว SEO ดี
2. **Web Application** — ระบบซับซ้อน (marketplace, booking, dashboard, internal tools) auth + realtime
3. **SaaS Platform** — multi-tenant, ระบบ subscription/บิลลิ่ง, admin & analytics, สเกลรองรับผู้ใช้จำนวนมาก
4. **AI Product / Integration** — chatbot, RAG, OCR/Document AI, automation ผสานเข้ากับ product
5. **Mobile App** — Flutter / React Native (iOS + Android)
6. **Customise / System Integration** — ระบบตามสั่ง, API, payment gateway, IoT (MQTT), เชื่อมต่อระบบเดิม

> จุดขาย: ทีมเดียวดูแลได้ตั้งแต่หน้าเดียวจนถึงระบบทั้งแพลตฟอร์ม — ช่วยลูกค้าเริ่มเล็กแล้วสเกลต่อได้โดยไม่ต้องเปลี่ยนทีม

### 4.6 หน้าอื่นๆ

**About (`/about`)** — โครง 6 บล็อก:
1. หัวข้อหลัก: ทีม Full-Stack + AI, ประสบการณ์, จำนวนผลงาน
2. สิ่งที่เราทำ: ประเภทงานที่รับ (SaaS, Web App, AI/แชทบอท/automation, ระบบภายใน)
3. ทำไมต้องเลือกเรา: 4 จุดขาย (ผลงานจริง / คุยกับ dev ตรง / เน้นผลลัพธ์ธุรกิจ / ดูแลหลังส่งมอบ)
4. ขั้นตอนการทำงาน 4 ขั้น (มุมมองลูกค้า): บอกความต้องการ → ประเมินขอบเขต+ราคา → ออกแบบและพัฒนา → ส่งมอบ ทดสอบ ดูแลต่อ
5. **SDLC ที่ใช้จริง** (มุมมองวิศวกรรม, 6 เฟส): Requirement Analysis → Design & Architecture → Development
   (Agile, TDD สำหรับ logic สำคัญ, code review ทุก PR) → Testing & QA (unit + E2E ก่อน merge ทุกครั้ง, UAT ร่วมลูกค้า)
   → Deployment (CI/CD, staging ก่อน production, มีแผน rollback) → Maintenance & Support — เสริมความน่าเชื่อถือ
   ด้านวิศวกรรมให้กลุ่มเป้าหมายที่เป็น CTO/technical founder โดยเฉพาะ (แยกจากข้อ 4 ที่เป็นมุมมองลูกค้า)
6. **ส่วน Certificate (ดูข้อ 4.7)** + CTA (Fastwork / คุยกับ AI / ลิงก์ FAQ)

**FAQ (`/faq`)** — Accordion ~14 คำถาม + FAQPage JSON-LD; หัวข้อตัวอย่าง: ใช้เวลากี่วัน · ราคาเริ่มต้น · รับงานประเภทไหน · บริการหลังส่งมอบ · เริ่มจ้างงานอย่างไร · ชำระเงินปลอดภัยไหม (ผ่าน Fastwork) · แก้ได้กี่รอบ · ใช้เทคโนโลยีอะไร · Responsive + SEO ไหม · เป็นเจ้าของเว็บ+โค้ดไหม · มีระบบ Admin หลังบ้านไหม · ทำระบบซับซ้อน/AI/จองได้ไหม · ทำไมต้องเลือกเรา; ปิดท้ายด้วย CTA "ไปถาม AI"

**Pricing Guide (`/pricing-guide`)** — ช่วงราคาตามประเภทงาน, สิ่งที่รวม/ไม่รวม, ขั้นตอนทำงาน
- **แพ็กเกจ** (เช่น MVP / Standard / Enterprise) + ขอบเขตแต่ละแพ็ก
- ระยะเวลาส่งมอบ · จำนวนรอบแก้ไข · เงื่อนไขชำระเงิน (ผ่าน Fastwork 100%)
- ระบุว่าลูกค้าเป็นเจ้าของเว็บ+โค้ดเมื่อส่งมอบ · มีบริการหลังส่งมอบ

**Blog (`/blog`)** — Breadcrumb → หัวข้อ+คำโปรย → รายการบทความ → Pagination + ช่องค้นหาบทความ
- การ์ดบทความ: ไอคอน · ชื่อ · คำโปรย · วันที่ · เวลาอ่าน · ยอดวิว
- แสดง ~12 ต่อหน้า; เน้นเนื้อหา SEO (เว็บ/AI/การตลาดดิจิทัล) — ดี organic traffic

**Partners (`/bw`)** — โลโก้/รายชื่อพันธมิตร

### 4.7 ส่วนใบรับรอง (Certificates Section)
แสดงใบรับรอง/ประกาศนียบัตรของทีม (~7–8 ใบ) เพื่อเสริมความน่าเชื่อถือ (social proof / trust)

**ตำแหน่งที่แสดง:**
- Section หนึ่งในหน้า `/about` (หลัก)
- (ออปชัน) มินิ-section บนหน้าแรก ใต้แถบตัวเลขความน่าเชื่อถือ

**รูปแบบการแสดงผล:**
- Grid การ์ด (มือถือ 1 คอลัมน์ / แท็บเล็ต 2 / เดสก์ท็อป 3–4)
- แต่ละการ์ด: ภาพย่อใบเซอร์, ชื่อหลักสูตร, ผู้ออก (issuer), ปีที่ได้รับ
- คลิกการ์ด → เปิด lightbox/modal ดูใบเต็ม (zoom ได้) หรือลิงก์ verify ภายนอก (ถ้ามี)
- โลโก้ผู้ออก (NVIDIA, Coursera, SET ฯลฯ) ช่วยเพิ่มน้ำหนักความน่าเชื่อถือ
- Lazy-load ภาพ, ใส่ `alt` ทุกใบ

**ข้อกำหนด:**
- จัดการผ่าน Admin/CMS ได้ (เพิ่ม/ลบ/จัดลำดับ)
- รองรับทั้งไฟล์ภาพ (jpg/png/webp) และ PDF (แสดง thumbnail)
- ไม่ควรทำให้หน้า about ช้า — ใช้ภาพย่อ + โหลดใบเต็มตอนเปิด modal เท่านั้น

**รายการใบรับรองของทีม (T4 Labs) — ข้อมูลตั้งต้น:**
| # | หลักสูตร | ผู้ออก (Issuer) |
|---|----------|------------------|
| 1 | AI for All: From Basics to GenAI Practice | NVIDIA |
| 2 | Basic Data Analytics Workshop | SIIT มหาวิทยาลัยธรรมศาสตร์ |
| 3 | Entrepreneurial Mindset | ตลาดหลักทรัพย์แห่งประเทศไทย (SET) |
| 4 | GenAI for Application Developers | Coursera |
| 5 | Cyber Security Awareness | สถาบันพัฒนาบุคลากรภาครัฐด้านดิจิทัล |
| 6 | AI Governance & Ethics | สถาบันพัฒนาบุคลากรภาครัฐด้านดิจิทัล |
| 7 | Road to Data Scientists | Microsoft & JA Thailand |

> เผื่อช่องสำหรับใบที่ 8 ในอนาคต — โครงสร้างรองรับจำนวนไม่จำกัด

---

## 5. ระบบผู้ช่วย AI (AI Assistant)

### 5.1 ความสามารถ (หน้า `/chat` + widget ลอย)
- แชตโต้ตอบ TH/EN แนะนำผลงาน/บริการที่ตรงโจทย์ → ลิงก์ไปหน้ารายละเอียดผลงาน
- **องค์ประกอบหน้า:** หัวข้อ + คำอธิบาย, กล่องสนทนา (bot ทักทาย + แทรกการ์ดผลงานตัวอย่างระหว่างคุย), ช่องพิมพ์ + ปุ่มส่ง
- **ปุ่ม/ฟีเจอร์:** แนบรูป (add photo), ล้างแชท, ปุ่มลัด **"สุ่มผลงานเด่น"** และ **"ประเมินงบเบื้องต้น"**, ปุ่มกลับหน้าแรก
- Quick-reply ตัวอย่าง (ปรับตาม positioning): "อยากได้ SaaS platform", "ทำ AI chatbot ได้ไหม", "แนะนำเคสงานที่เหมาะกับฉัน", "ประเมินงบเบื้องต้น"
- โหมด guided tour: พาชมเว็บทีละส่วน
- แสดง disclaimer: "AI อาจมีข้อผิดพลาด โปรดตรวจสอบข้อมูล"

### 5.2 สถาปัตยกรรมแนะนำ
- Frontend chat UI (ทั้งแบบ floating widget และหน้า `/chat` เต็ม)
- Backend API route เรียก LLM (เช่น OpenAI/Claude API) แบบ streaming
- **RAG:** ทำ embedding ข้อมูลผลงาน/บริการ/FAQ เก็บใน vector store (เช่น pgvector, Pinecone) เพื่อให้ AI ตอบอ้างอิงจากผลงานจริง
- System prompt กำหนดบทบาท: ผู้ช่วยแนะนำงานของทีม, ตอบเฉพาะขอบเขตบริการ, ปิดท้ายชวนติดต่อ
- Rate limiting + reCAPTCHA v3 กันสแปม
- เก็บ log บทสนทนา (ไม่เก็บข้อมูลส่วนบุคคลเกินจำเป็น) เพื่อวิเคราะห์ lead

### 5.3 ข้อกำหนดที่ไม่ใช่ฟังก์ชัน
- ตอบเริ่มสตรีมภายใน ~2 วินาที
- Fallback ข้อความเมื่อ API ล่ม + ปุ่มไปช่องทางติดต่อจริง

### 5.4 ป๊อปอัพทักทาย + แผงสรุปขอบเขตงาน

> ดัดแปลงจากสเปกอ้างอิง "Bigzweb AI Chat Assistant" (ปรับชื่อ/แบรนด์เป็น T4 Labs AI) — ส่วนที่ทับซ้อนกับ §5.1
> (suggested prompts, quick actions "สุ่มผลงานเด่น"/"ประเมินงบเบื้องต้น") ถือว่าครอบคลุมแล้วโดย §5.1 ไม่ต้องทำซ้ำ
> ส่วนแผนที่พิกเซลอาร์ตแบบเกม (gamified pixel-art map พร้อมตัวละครเดินเล่น) **เลื่อนไว้ก่อน** — ต้องมี asset
> กราฟิกจริงจึงจะคุ้มทำ ไม่ทำจาก placeholder

**Entry point — ป๊อปอัพทักทายหน้าแรก (FR-01, FR-02):**
- ข้อความ: "สวัสดีครับ ผมเป็นผู้ช่วย T4 Labs AI อยากให้ผมพาชมเว็บไหมครับ?"
- Trigger: แสดงอัตโนมัติหลังเข้าเว็บไซต์ครั้งแรกได้สักครู่ (first visit เท่านั้น — จำสถานะด้วย localStorage เพื่อไม่ให้กวนผู้ใช้ที่กลับมาเยี่ยมซ้ำ)
- แสดงเป็น Chat Bubble มุมขวาล่างของจอ พร้อมไอคอนตัวละคร (Avatar)
- ปุ่มตอบสนอง:
  | ปุ่ม | พฤติกรรม |
  |---|---|
  | เอาเลย พาชมหน่อย | นำทางไปหน้า `/chat` |
  | คุยกับเรา | นำทางไปหน้า `/chat` เช่นเดียวกัน |
  | ไว้ก่อน | ปิดข้อความทักทาย ไม่นำทางออกจากหน้าปัจจุบัน |
  | ไอคอน X (มุมขวาบนของ bubble) | ปิดข้อความทักทายทันที |

**แผงสรุปขอบเขตงาน (Scope Summary Panel, FR-08) — เฉพาะหน้า `/chat`:**
- ไอคอนเอกสารลอยมุมขวาล่างของจอตลอดเวลาขณะอยู่หน้า `/chat`
- เมื่อ hover/คลิกก่อนเริ่มคุย แสดง tooltip: "เริ่มพูดคุยกับ AI ระบบจะสรุปขอบเขตงานให้อัตโนมัติ"
- เมื่อมีบทสนทนาแล้ว แผงจะอัปเดตอัตโนมัติเป็นสรุป: ประเภทงาน, งบประมาณเบื้องต้น (ช่วงราคา), ระยะเวลา (ประเมินหลังสรุปขอบเขตงาน), requirement เด่นที่จับใจความได้จากบทสนทนา
- สกัดข้อมูลด้วย LLM เรียกแบบ non-streaming แยกจากการตอบแชทหลัก อ้างอิงจาก log บทสนทนาของ session นั้น ๆ เท่านั้น (ไม่สร้างข้อมูลเท็จ)

**FR สรุปเพิ่มเติม:**
| ID | รายละเอียด |
|---|---|
| FR-01 | ระบบต้องแสดงป๊อปอัพทักทายพร้อมปุ่ม 3 แบบตามที่ระบุ เฉพาะการเข้าชมครั้งแรก |
| FR-02 | ปุ่ม "เอาเลย พาชมหน่อย" และ "คุยกับเรา" ต้องนำทางไปหน้า `/chat` |
| FR-08 | แผงสรุปขอบเขตงานต้องอัปเดตอัตโนมัติตามเนื้อหาการสนทนา โดยอ้างอิงจากบทสนทนาจริงเท่านั้น |

### 5.5 ถามรายละเอียดผลงานเฉพาะจากหน้าโปรเจกต์ (FR-09)

หน้ารายละเอียดผลงาน (`/projects/[slug]`) มีปุ่ม **"ถามรายละเอียดผลงานนี้กับ AI"** แยกจากปุ่ม
"คุยกับ AI ดูงานคล้ายกัน" เดิม (คนละวัตถุประสงค์ — อันนี้ถามลึกเรื่องผลงานที่กำลังดูอยู่ ไม่ใช่หาโปรเจกต์อื่นที่คล้ายกัน)

- คลิกแล้วไปที่ `/chat?project=<slug>` — หน้า `/chat` ยังคง static ได้ (อ่าน query param ผ่าน client hook
  ใน Suspense boundary เท่านั้น ไม่ผ่าน server-side `searchParams`)
- แสดงแบนเนอร์ "กำลังคุยเกี่ยวกับผลงาน: {ชื่อผลงาน}" พร้อมปุ่มปิดเพื่อเลิกอ้างอิง (ผู้ใช้เปลี่ยนหัวข้อคุยได้อิสระ)
- ส่งคำถามเปิดอัตโนมัติ 1 ครั้ง ("บอกรายละเอียดเพิ่มเติมเกี่ยวกับผลงาน...")
- **สำคัญ:** grounding เป็นแบบ deterministic ไม่ใช่แค่ semantic/embedding retrieval — ทุกข้อความที่ส่งระหว่างอ้างอิง
  ผลงานนี้ จะแนบ `projectSlug` ไปกับ backend ซึ่งดึงข้อมูลผลงานเต็ม (ชื่อ, หมวดหมู่, เทคโนโลยี, แท็ก, คำอธิบาย,
  รายละเอียด, ลิงก์เว็บจริง) ตรงจากตาราง `projects` ด้วย slug ที่แน่นอน แล้วฝังเป็น system-prompt block
  แยกจาก context ที่ค้นด้วย RAG ปกติ — กันปัญหา embedding search แนะนำผลงานอื่นที่ใกล้เคียงแทนผลงานที่ผู้ใช้กำลังดูอยู่จริง

| ID | รายละเอียด |
|---|---|
| FR-09 | ปุ่ม "ถามรายละเอียดผลงานนี้กับ AI" ต้องพาไป `/chat` พร้อมอ้างอิงผลงานนั้น และคำตอบของ AI ต้องอ้างอิงข้อมูลผลงานจริงเสมอ (deterministic, ไม่ใช่แค่ผลลัพธ์จาก semantic search) |

---

## 6. โมเดลข้อมูล (Data Model)

### 6.1 Project
| ฟิลด์ | ชนิด | หมายเหตุ |
|------|------|----------|
| id | uuid/int | PK |
| slug | string (unique) | ใช้ใน URL |
| title | string | |
| title_en | string | สำหรับ EN |
| description | text | คำอธิบายสั้น |
| content | rich text | รายละเอียดเต็ม |
| category_id | FK | หมวดหลัก |
| business_types | array | ประเภทที่ recommend (ecommerce ฯลฯ) |
| tags | array | คีย์เวิร์ด |
| technologies | array/relation | เทคโนโลยีที่ใช้ |
| snapshot_image | url | ภาพปก |
| gallery | array<url> | ภาพเพิ่มเติม |
| video_url | url (nullable) | วิดีโอแนะนำ |
| live_url | url (nullable) | ลิงก์เว็บจริง |
| is_featured | bool | แสดงใน carousel |
| published_at | datetime | |
| sort_order | int | |

### 6.2 Category
`id, name, name_en, slug, sort_order`

### 6.3 Technology
`id, name, slug` (ใช้กรอง `?tech=`)

### 6.3b Tag
`id, name, slug` (แท็กเฉพาะงาน ใช้กรอง `?tag=` และ map ผลงานเข้าหน้า solution landing)

### 6.4 BlogPost
`id, slug, title, excerpt, content, cover_image, author, tags, published_at, read_time_min, views, seo_meta`

### 6.5 Service
`id, number, title, target_audience, description, icon`

### 6.6 FAQ
`id, question, answer, sort_order, category`

### 6.7 Lead / ContactClick (analytics)
`id, source_page, cta_type, created_at` — track การคลิกปุ่มติดต่อ

### 6.8 Certificate
| ฟิลด์ | ชนิด | หมายเหตุ |
|------|------|----------|
| id | uuid/int | PK |
| title | string | ชื่อหลักสูตร |
| title_en | string | สำหรับ EN |
| issuer | string | ผู้ออก เช่น NVIDIA, Coursera, SET |
| issuer_logo | url (nullable) | โลโก้ผู้ออก |
| issued_year | int/date | ปีที่ได้รับ |
| thumbnail | url | ภาพย่อสำหรับการ์ด |
| full_image | url | ไฟล์ใบเต็ม (jpg/png/webp/pdf) |
| verify_url | url (nullable) | ลิงก์ตรวจสอบ (ถ้ามี) |
| is_featured | bool | โชว์บนหน้าแรกด้วยไหม |
| sort_order | int | ลำดับการแสดง |

### 6.9 PreviewScreen (Interactive Preview — ข้อ 4.4.1)
| ฟิลด์ | ชนิด | หมายเหตุ |
|------|------|----------|
| id | uuid/int | PK |
| title | string | ชื่อหน้า เช่น "Login / Auth" |
| roles | array<string> | Role ที่เข้าถึง เช่น ["admin","user"] |
| description | string | คำอธิบายสั้น 1 บรรทัด |
| components | array<string> | รายการ UI component ในหน้า |
| view | enum(`client`,`admin`) | มุมมอง |
| style_variant | enum(1,2,3) | สไตล์ mockup |
| mockup_image | url | ภาพต่อ (view × style) |
| sort_order | int | ลำดับใน preview |

> โครง content เดียว (title/roles/description/components) ใช้ร่วมทั้ง 2 view; แตกต่างที่ `mockup_image` ตาม view × style (2 × 3 = 6 ภาพต่อหน้า)

### 6.10 FeatureGroup (Feature Checklist — ข้อ 4.4.2)
`id, title, icon, item_count, items (array<string>), sort_order` — 6 กลุ่ม (Auth, Dashboard/Report, CRUD, Integration, Upload, Performance/Security)

---

## 7. ข้อกำหนดทางเทคนิค (Technical Requirements)

> Stack นี้อิงตามความถนัดจริงของทีม **T4 Labs** (Next.js / Nest.js / Supabase / Cloudflare / AI RAG) เพื่อให้พัฒนาเองได้เต็มประสิทธิภาพ

### 7.0 Tooling / Runtime
- **Package manager & runtime: Bun** (ใช้แทน npm ทั้งโปรเจกต์)
  - ติดตั้ง: `bun install` · รันdev: `bun run dev` · build: `bun run build` · สคริปต์: `bun run <script>`
  - ใช้ `bunx` แทน `npx`, commit `bun.lockb` (ไม่ใช้ package-lock.json/yarn.lock)
  - Dockerfile/CI ใช้ base image `oven/bun`; ตั้ง Vercel/CI ให้ install/build ด้วย Bun
  - (ออปชัน) ใช้ Bun เป็น runtime ของ backend/Nest.js ได้ถ้าต้องการ performance

### 7.1 Frontend
- **Framework:** Next.js (App Router) + React + **TypeScript** (รันด้วย Bun)
- **Styling:** Tailwind CSS
- **Rendering:** SSG/ISR สำหรับหน้าผลงานและบล็อก (ดี SEO + เร็ว), CSR สำหรับ chat แบบ real-time
- **UX/UI:** ออกแบบใน Figma ก่อนลงมือ
- **i18n:** next-intl (TH default, EN)
- Component หลัก: Navbar, Hero, ProjectCard, ProjectGrid, FilterTabs, ServiceCard, TechChips, ChatWidget, Footer

### 7.2 Backend / CMS
- **API layer:** Nest.js (TypeScript) เป็น backend หลัก — จัด business logic, AI orchestration, auth
  - ทางเลือกเบา: ใช้ Next.js API routes / Server Actions ตรงๆ ถ้าอยาก monorepo เดียวจบ
- **Database:** **Supabase (PostgreSQL)** เป็นตัวหลัก — ได้ Auth, Realtime, Storage, และ **pgvector** สำหรับ RAG ในตัว
  - MySQL / MongoDB ใช้เสริมได้ตามงานที่ถนัดอยู่แล้ว
- **Auth (แอดมิน):** Supabase Auth (Email OTP) หรือ Firebase Auth
- **CMS:** เขียน Admin เองบน Next.js + Supabase (CRUD ผลงาน/บทความ) หรือใช้ Supabase Studio เป็น backend ชั่วคราวในเฟสแรก

### 7.3 Media / Hosting / Infra
- เก็บภาพ snapshot/แกลเลอรีใน **Supabase Storage** หรือ **Cloudflare R2** + CDN
- ใช้ `next/image` ปรับขนาด/แปลง webp อัตโนมัติ
- **Deploy:** Vercel (frontend) หรือ self-host หลัง **Cloudflare** (CDN, WAF, DNS, Tunnel, Zero Trust)
- **Network & Routing:** Nginx reverse proxy, SSL/TLS, API Gateway, load balancing ตามสเกล
- **Real-time:** WebSocket / Socket.io / SSE สำหรับสตรีมคำตอบ AI และ live features

### 7.4 การผสาน (Integrations)
- ปุ่มจ้างงาน → ลิงก์ platform ภายนอก (Fastwork) เปิด external browser
- **AI Integration:** LLM API + RAG (pgvector) + Chatbot — ต่อยอดจากความเชี่ยวชาญ OCR/LLM/Document AI ของทีม
- Payment Gateway (เฉพาะเฟสถัดไปถ้าจะรับชำระบนเว็บ)
- Notification: Firebase Cloud Messaging (FCM) / Email-SMS OTP ผ่าน Supabase/Firebase (ถ้ามีฟอร์ม/แจ้งเตือน)
- reCAPTCHA v3 บนฟอร์ม/แชต + Cloudflare WAF กัน bot
- Analytics: Google Analytics 4 + Google Tag Manager + Cloudflare Web Analytics

---

## 8. SEO & Performance

### 8.1 SEO
- Meta title/description ต่อหน้า + keyword ภาษาไทย ("รับทำเว็บไซต์" ฯลฯ)
- Open Graph + Twitter Card (og:image 1200×630)
- Canonical URL, hreflang (th/en)
- JSON-LD: Organization, WebSite, BreadcrumbList, CreativeWork (ผลงาน), FAQPage, BlogPosting
- `sitemap.xml` + `robots.txt`
- meta geo (Bangkok, TH), theme-color

### 8.2 Performance
- เป้าหมาย Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Lazy-load ภาพและ carousel, code splitting
- Preconnect/preload ฟอนต์ (Google Fonts + subset ไทย)
- Cache/ISR สำหรับหน้า static-heavy

---

## 9. Non-Functional Requirements
- **Responsive:** รองรับ 320px – desktop, mobile-first
- **Accessibility:** โครงสร้าง semantic, alt ภาพ, ปุ่ม skip-to-content, คอนทราสต์ผ่าน WCAG AA
- **ความปลอดภัย:** CSRF token บนฟอร์ม, sanitize input, rate limit, HTTPS, security headers
- **ความเข้ากันได้:** เบราว์เซอร์รุ่นล่าสุด Chrome/Safari/Firefox/Edge
- **Maintainability:** โครงสร้างคอมโพเนนต์ชัดเจน, ENV แยก config, เขียน README/deploy doc

---

## 10. Admin / CMS Requirements
- ระบบล็อกอินสำหรับแอดมิน
- CRUD: ผลงาน, หมวดหมู่, เทคโนโลยี, บริการ, บทความ, FAQ, **ใบรับรอง (Certificate)**
- อัปโหลดภาพ/วิดีโอ + จัดลำดับ (sort/drag)
- ตั้ง featured, published/draft
- แก้ไขเนื้อหา 2 ภาษา
- ดู log แชต AI และสถิติคลิกปุ่มติดต่อ

---

## 11. แผนพัฒนาเป็นเฟส (Phased Roadmap)

**Phase 1 — MVP**
หน้าแรก, รวมผลงาน + รายละเอียด, บริการ, ติดต่อ, responsive, SEO พื้นฐาน, CMS จัดการผลงาน

**Phase 2 — AI & Content**
ผู้ช่วย AI (chat + RAG), หน้า recommend ตามประเภท, บล็อก, guided tour

**Phase 3 — Optimize**
i18n EN เต็มระบบ, analytics/tracking ครบ, ปรับ performance, A/B test ปุ่ม CTA, dashboard lead

---

## 12. เกณฑ์การยอมรับ (Acceptance Criteria ตัวอย่าง)
- [ ] ผู้ใช้เข้าหน้าแรกบนมือถือแล้วเห็น Hero + CTA ภายใน 1 หน้าจอ
- [ ] กรองผลงานตามหมวด/เทคโนโลยีได้ และ URL เปลี่ยนตาม query
- [ ] เปิดหน้ารายละเอียดผลงานแล้วมี OG image และลิงก์เว็บจริง
- [ ] แชต AI ตอบคำถามและแนะนำผลงานที่มีอยู่จริงได้ พร้อม disclaimer
- [ ] Lighthouse: Performance/SEO/Best Practices ≥ 90
- [ ] แอดมินเพิ่มผลงานใหม่แล้วขึ้นหน้าเว็บโดยไม่ต้อง deploy ใหม่ (ISR/CMS)
- [ ] สลับ TH/EN ได้ทุกหน้าโดยเนื้อหาเปลี่ยนภาษา

---

## 13. คำถามที่ต้องเคลียร์ก่อนเริ่ม (Open Questions)
- ใช้ LLM เจ้าไหน และงบ token ต่อเดือนเท่าไร?
- เนื้อหา EN แปลเองหรือใช้ระบบแปล?
- จัดการผลงานผ่าน headless CMS สำเร็จรูป หรือเขียน admin เอง?
- ช่องทางจ้างงานหลักใช้ platform ภายนอกหรือฟอร์มบนเว็บ?
- ต้องเก็บข้อมูลติดต่อลูกค้า (PDPA) หรือไม่ ต้องมีนโยบายความเป็นส่วนตัว

---

## 14. Design & Art Direction

> เป้าหมาย: เว็บต้องดูเหมือนงานจาก **digital agency ระดับมืออาชีพ** — มีรสนิยม มีความเป็นมนุษย์ และมี Art Direction ชัดเจน **ไม่ใช่ template สำเร็จรูป** และต้องหลีกเลี่ยงงานแบบ "AI slop" (เจเนอริก, ฟุ้ง, ไร้จุดยืน)

### 14.0 Brand Personality & Voice
บุคลิกของเว็บ (ให้ทุกการตัดสินใจด้านดีไซน์และ copy ยึดตามนี้):

**มั่นใจ · มืออาชีพ · เรียบง่าย · ฉลาด · ทันสมัย · เข้าถึงง่าย — โดยไม่ดูพยายามมากเกินไป**

แปลเป็นแนวปฏิบัติ:
- **มั่นใจ:** พูดตรง สั้น กระชับ ไม่ต้องอวดเยอะ ("We build products that scale." ไม่ใช่ "We are passionate about leveraging...") — ปล่อยให้ผลงานพูดแทน
- **มืออาชีพ:** ดีเทลเป๊ะ กริดตรง ไทโปคุมโทน ไม่มีจุดเลอะ
- **เรียบง่าย:** ตัดสิ่งไม่จำเป็นออก whitespace เยอะ หนึ่งความคิดต่อหนึ่งบล็อก
- **ฉลาด:** โชว์ความเข้าใจเชิงเทคนิค (stack, สถาปัตยกรรม, ตัวเลข) อย่างมั่นใจแต่ไม่โอ้อวด
- **ทันสมัย:** Liquid Glass, motion ประณีต, ฟอนต์ร่วมสมัย
- **เข้าถึงง่าย:** ภาษามนุษย์ อ่านง่าย มีความอบอุ่น (warm off-white, มี humor เบา ๆ ได้)
- **ไม่พยายามมากเกินไป:** ไม่มี animation หวือหวาเกิน, ไม่มีสีจัดจ้าน, ความหรูมาจาก **"รายละเอียดเล็ก ๆ"** ไม่ใช่ลูกเล่นใหญ่

**Premium อยู่ที่ดีเทลเล็ก ๆ:** ระยะห่างที่พอดี, เส้น hairline คม, การจัดแนว optical, transition ลื่น 200–300ms, specular บนกระจกบาง ๆ, mono label ที่ align เป๊ะ, grain จาง ๆ, micro-interaction ที่ตอบสนองนุ่มนวล — สิ่งเหล่านี้รวมกันคือความ "แพง"

### 14.1 Design Concept
**"Editorial Minimalism × Modern Swiss × Liquid Glass"**
รากฐานคือความเรียบ-แม่นยำแบบ Swiss (กริดเข้ม, ไทโปกราฟีเป็นพระเอก, พื้นที่ว่างเยอะ) เล่าเรื่องแบบนิตยสาร (editorial hierarchy, ตัวเลข index, caption แบบ mono) แล้ววางองค์ประกอบ **Liquid Glass** (พื้นผิวกระจกโปร่งเบลอ มีมิติ) เป็นเลเยอร์ลอยด้านบน — ให้ความรู้สึกพรีเมียม ทันสมัย และ "ทำด้วยมือ"

หลักคิด 3 ข้อ:
- **Precision (Swiss):** ทุกอย่างอยู่บนกริด, จัดชิดซ้าย/baseline ตรง, ไม่มีอะไรลอยมั่ว
- **Editorial voice:** ตัวหนังสือใหญ่ กล้า มี rhythm แบบนิตยสาร, ใช้ index number (01–06), caption/label เป็น mono
- **Liquid Glass depth:** nav, การ์ด, chat widget, modal เป็นกระจกโปร่ง (frosted) มี specular highlight บาง ๆ ให้รู้สึกมีวัสดุจริง

### 14.2 Color System
พื้นหลังเลือกได้จากโทน **Off-white / Warm Gray / Charcoal** + **Accent เพียงหนึ่งสี** (ตามที่กำหนด) — ห้ามเกินหนึ่ง accent เด็ดขาด (หลายสี = ดูมั่ว/AI slop)

โทนหลักที่ใช้ (light-first, near-monochrome):

| บทบาท | ค่า (token) | ใช้กับ |
|-------|-----|--------|
| Canvas / paper | `#F4F2ED` (warm off-white) | พื้นหลังหลัก — ไม่ใช่ขาวจัด ให้อบอุ่นเป็นมนุษย์ |
| Ink | `#131311` (near-charcoal) | ตัวหนังสือหลัก, เส้น hairline เข้ม |
| Muted (warm gray) | `#6B6862` | body รอง, caption |
| Faint | `#9A968D` | metadata, label จาง |
| Line | `rgba(19,19,17,.14)` / soft `.08` | เส้น hairline คั่น |
| **Accent (สีเดียว)** | `#E8461B` (signal orange) | เน้นจุดเดียว: index number, hover, ปุ่มหลัก, underline, จุด live |
| Glass tint | `rgba(244,242,237,.6)` + blur | เฉพาะ Liquid Glass nav |

- **โหมด Charcoal / Dark (ออปชัน):** canvas `#131315`, ink `#F0EEE8`, muted `#9A968D`, accent เดิม — สลับ token ชุดเดียว
- ใช้ accent อย่างประหยัด — ถ้าใช้ส้มทุกที่จะกลายเป็น "accent มากเกินไป" (ต้องห้าม)
- แนะนำ **noise/grain overlay** จาง ๆ (opacity ~3–4%) เพิ่มความเป็นวัสดุ ลดความ "ดิจิทัลเกินไป"

### 14.3 Typography
Swiss = ไทโปคือทุกอย่าง เลือกคู่ฟอนต์ที่มีคาแรกเตอร์ ไม่ใช่ default

- **Display / Headline:** grotesque สมัยใหม่ที่มีบุคลิก เช่น *PP Neue Montreal, Söhne, Aeonik* (ทางเลือกฟรี: **Space Grotesk** หรือ **Manrope**) — ใช้ตัวใหญ่มาก (clamp 40–96px), tracking แน่น, line-height ต่ำ (~0.95–1.05)
- **Body:** neo-grotesque อ่านง่าย เช่น *Inter* / *Söhne* — 16–18px, line-height 1.6
- **Mono (label/metadata):** *JetBrains Mono* / *Berkeley Mono* — ใช้กับ label, index, caption, tag เทคโนโลยี (uppercase, letter-spacing กว้าง, ~12px)
- **Thai:** จับคู่ให้กลมกลืน — *IBM Plex Sans Thai*, *Anuphan*, หรือ *LINE Seed Sans Thai*; ตั้ง fallback และปรับ line-height ไทยให้พอดี (ไทยต้องการ leading มากกว่าละติน)

**ระบบ 4 ชั้น — ต้องมี contrast ชัดระหว่างชั้น** (ห้ามใช้หลายขนาดใกล้ ๆ กัน):

| ชั้น | ฟอนต์ / น้ำหนัก | ขนาด | คาแรกเตอร์ |
|------|------------------|------|-----------|
| **Heading** | Display grotesque 600 | clamp 28–140px | ตัวใหญ่ กล้า tracking แน่น line-height ~1 |
| **Body** | Sans 400 | 16–18px | อ่านสบาย line-height 1.6 |
| **Label** | Mono 500 | 12px | UPPERCASE, letter-spacing .16em, สี ink — ใช้กับ nav, section tag |
| **Metadata** | Mono 400 | 11px | UPPERCASE จาง (faint), letter-spacing .12em — index, caption, tech tag, ตัวเลขข้อมูล |

- คอนทราสต์สเกลสูงคือหัวใจ Swiss: Heading กระโดดจาก Body ชัด, Label/Metadata เป็น mono ให้ต่างจากเนื้อความทันที
- **ตัวใหญ่ได้ แต่ต้องมีเหตุผลทาง visual hierarchy** — ใช้ขนาดใหญ่กับสิ่งที่สำคัญที่สุดของ section นั้น (value prop, ชื่อบริการ, headline) ไม่ใช่ทำ hero ใหญ่เพื่อความเท่อย่างเดียว

### 14.4 Layout & Grid
**องค์ประกอบหลักของงานออกแบบคือ Grid · Negative Space · Typography · Alignment** (ไม่ใช่ลูกเล่นตกแต่ง)

- **Layout ต้องมีจังหวะและลำดับสายตาชัดเจน** — ตาผู้อ่านรู้ว่าจะไปไหนต่อ (มี focal point ต่อ section)
- **ไม่จำเป็นต้องจัดทุกอย่างให้อยู่กลาง** — ใช้ asymmetry บนกริดอย่างตั้งใจ (การจัดกลางหมดทุกอย่าง = สัญญาณ template)
- **กริด 12 คอลัมน์** (desktop), gutter สม่ำเสมอ, max-width ~1280–1440px, margin ขอบกว้าง, ใช้ **baseline grid** จัดแนวตั้ง
- **Negative space เยอะ ๆ** ปล่อยให้เนื้อหาหายใจ — ความว่างคือส่วนหนึ่งของดีไซน์
- **Alignment เป๊ะ** — ทุกอย่าง snap เข้ากริด/ขอบเดียวกัน (Swiss precision)
- **แต่ละ section ต้องมีโครงสร้างต่างกัน** — ห้ามทุก section หน้าตาเหมือนกัน (เช่น hero split / band แนวนอน / list ในคอลัมน์ / gallery อสมมาตร / ตาราง)
- **Index numbering** (01 / 02 …) กำกับ section และผลงาน — motif หลัก
- เส้น **hairline rule** คั่น section แบบนิตยสาร

> **อิสระในการตีความ Layout:** เว็บควรมี section ตามที่ระบุ (ข้อ 3–4) แต่การจัดวางภายในแต่ละ section ตีความได้อิสระตามหลักด้านบน ไม่ต้องยึด layout ตายตัว

### 14.5 Liquid Glass — ใช้เป็น "accent วัสดุ" เท่านั้น
> Liquid Glass เป็นซิกเนเจอร์ แต่ **ต้องใช้อย่างจำกัด** — ห้าม glassmorphism เยอะทั้งหน้า (เป็นหนึ่งในสัญญาณ AI slop)

- ใช้กับ **เลเยอร์ที่ลอยเหนือคอนเทนต์จริง ๆ เท่านั้น**: หลัก = **navbar (sticky)** ที่ลอยเหนือเนื้อหาตอนเลื่อน; มากสุด 1–2 จุด (เช่น modal/lightbox ตอนเปิด)
- **การ์ดทั่วไป ไม่ใช้ glass** — ใช้พื้นทึบ + hairline แทน
- `backdrop-filter: blur(20–24px) saturate(150%)` + ขอบ hairline สว่าง (specular) บาง ๆ + เงานุ่ม **เบามาก** (ไม่ใช่เงาหนา)
- glass ต้องมี "อะไรอยู่ข้างหลัง" ให้เบลอผ่าน ถึงจะมีความหมาย
- Fallback: เบราว์เซอร์ไม่รองรับ backdrop-filter → พื้นทึบโปร่งเล็กน้อยแทน
- ระวัง performance บนมือถือ (จำกัด glass layer, `will-change` เท่าที่จำเป็น)

### 14.6 Motion & Micro-interactions
**หลักการ: animation ต้องช่วยเพิ่มความเข้าใจหรือความรู้สึกของเว็บ — ไม่ใช่ทำเพื่อโชว์เทคนิค** ใส่อย่างระมัดระวัง (subtle) เท่านั้น

Micro-interaction ที่ควรมี:
- **Navigation transition** — เปลี่ยนหน้า/scroll ลื่น, nav ปรับความใส/เงาตอนเลื่อน
- **Hover state ของ Project** — ภาพ zoom เบา (~1.03), ชื่อเปลี่ยนเป็น accent, caption ค่อย ๆ ปรากฏ
- **Text reveal บางส่วน** — fade + translate สั้น ๆ (200–400ms, ease-out) ตอน section เข้า viewport
- **Subtle image / layout movement** — parallax เบามาก หรือ image scale ตอน hover
- **Smooth mobile menu** — เปิด/ปิดนุ่มนวล ไม่กระตุก
- ปุ่ม/ลิงก์: hover + focus state ชัด, underline/สีวิ่งนุ่ม 200–300ms

ข้อห้าม:
- **ห้าม animation เกิดกับทุกองค์ประกอบ** — reveal ระดับ section/บล็อก ไม่ใช่ทุกชิ้น stagger รัว ๆ
- ไม่มี motion หวือหวาเพื่ออวดเทคนิค
- **รองรับ `prefers-reduced-motion`** เสมอ (ปิด transition/parallax ให้หมด)

### 14.7 Imagery & Human Touch
สิ่งที่ทำให้ "เป็นมนุษย์" และไม่ใช่ AI slop:
- ใช้ **ภาพผลงานจริง** ใน browser/device frame ที่ออกแบบเอง (ไม่ใช่ mockup สำเร็จรูปเกลื่อน)
- **ภาพทีมจริง / เบื้องหลังการทำงาน** ในหน้า About + ส่วน Certificate
- Custom diagram / เส้นวาดอธิบายสถาปัตยกรรม (แสดงความเชี่ยวชาญ)
- Caption เขียนมือแบบมีน้ำเสียง ไม่ใช่ประโยคการตลาดฟุ้ง ๆ
- คอนเทนต์ **เฉพาะเจาะจง** (ชื่อจริง, ตัวเลขจริง, stack จริง) — ความเจาะจงคือยาแก้ AI slop

### 14.8 Anti-"AI Slop" — รูปแบบต้องห้าม (ห้ามทุกข้อ)
ห้ามใช้รูปแบบที่พบบ่อยในเว็บที่สร้างด้วย AI:
- [ ] ❌ Gradient สีม่วง/น้ำเงิน/ชมพู เต็มหน้าจอ (รวม mesh gradient)
- [ ] ❌ Glassmorphism จำนวนมาก (glass ใช้เฉพาะ nav/เลเยอร์ลอย 1–2 จุด)
- [ ] ❌ กล่อง Card ขอบมนเหมือนกันทุก section
- [ ] ❌ Floating Orb / Blob ตกแต่งพื้นหลัง
- [ ] ❌ Glow effect รอบทุกองค์ประกอบ
- [ ] ❌ Hero ที่มีแค่ heading อยู่กลาง + ปุ่มสองปุ่ม
- [ ] ❌ Grid การ์ด 3 ใบที่หน้าตาเหมือนกันเป๊ะ
- [ ] ❌ Dashboard mockup แบบ generic
- [ ] ❌ ข้อความประเภท "Revolutionize your workflow" / marketing ที่กว้างไม่มีความหมาย
- [ ] ❌ Icon ในกล่องสี่เหลี่ยม gradient
- [ ] ❌ Animation ที่เกิดกับทุกองค์ประกอบ
- [ ] ❌ Border radius ใหญ่เกินความจำเป็น
- [ ] ❌ เงาหนา หรือใช้สี accent มากเกินไป
- [ ] ❌ ใส่ element เติมพื้นที่โดยไม่มีจุดประสงค์
- [ ] ❌ ทุก section มีโครงสร้างเหมือนกัน

สิ่งที่ต้อง **มี** แทน (ยาแก้ AI slop):
- [ ] ✅ copy เฉพาะเจาะจง มีน้ำเสียงจริง (ชื่องาน/ตัวเลข/stack จริง)
- [ ] ✅ accent สีเดียว · ฟอนต์คู่เดียว · spacing scale เดียว (4/8/16/24/48/96)
- [ ] ✅ detail ที่ "ทำด้วยมือ": index number, mono label, hairline, grain
- [ ] ✅ แต่ละ section โครงสร้างต่างกัน, asymmetry บนกริด
- [ ] ✅ ทั้งเว็บรู้สึกเป็น "ระบบเดียวกัน"

### 14.9 Signature Elements (motif ประจำแบรนด์)
เพื่อความจำและความเป็นเอกลักษณ์ ให้มี motif ซ้ำทั้งเว็บ:
- ระบบ **index number** `01 — 06` กำกับทุก section/ผลงาน
- **mono tag** สำหรับเทคโนโลยี/หมวด (`[ NEXT.JS ]`, `[ SAAS ]`)
- **accent underline** ที่วิ่งตอน hover
- **Liquid Glass nav** ที่ลอยและปรับความใสตาม scroll
- (ออปชัน) แถบ **system status ticker** เล็ก ๆ ("500+ projects · 5 yrs · TH/EN") แบบ mono

### 14.10 Deliverables ฝั่งดีไซน์ (แนะนำ)
- **Figma:** design tokens (สี/ไทโป/สเปซ), component library, หน้าออกแบบจริง 5–6 หน้า, prototype motion
- ส่งเป็น design system ให้ dev implement 1:1 (เชื่อมด้วย Tailwind config = tokens)

### 14.11 Signature Visual — System Schematic
Visual ที่สื่อ **กระบวนการคิด / การออกแบบระบบ / การสร้าง product**:
- **ห้ามใช้ภาพ stock และห้ามใช้ dashboard mockup แบบ generic**
- สร้างด้วย **CSS / Typography / Grid / Line / Label / Shape / UI fragment** ที่มีความหมายจริง
- ตัวอย่างที่ใช้: schematic ของ data flow หนึ่ง request — `Client (Next.js) → Edge (Cloudflare) → API (Nest.js) → Data (Supabase · pgvector) → AI (LLM · RAG)` เป็น node + เส้น + mono label
- ประกอบกับขั้นตอนทำงาน `Discovery → Architecture → Build → Ship → Scale`
- สื่อความเชี่ยวชาญเชิงเทคนิคโดยไม่ต้องพึ่งภาพประกอบสำเร็จรูป

---

## 15. UX Requirements
- **Responsive ทุกขนาดหน้าจอ** (มือถือ–เดสก์ท็อป)
- **Mobile layout ออกแบบจริง ไม่ใช่แค่ย่อ desktop** — จัดลำดับ/สเกล/เมนูใหม่ให้เหมาะจอเล็ก
- **Navigation ใช้งานได้จริง** ทุก breakpoint (มี mobile menu ที่ลื่น)
- ปุ่มและลิงก์ทุกตัวมี **hover state + focus state** ชัดเจน
- **Contrast อ่านง่าย** (ผ่าน WCAG AA)
- รองรับ **keyboard navigation** (tab order, focus-visible)
- ใช้ **heading structure ถูกต้อง** (h1→h2→h3 ตามลำดับความหมาย)
- **ไม่มี horizontal overflow** ทุกจอ
- **ไม่มีข้อความล้น container**
- **ไม่มี element ซ้อนกันเมื่อจอเล็ก**
- ใช้ภาพ/visual ที่ **โหลดเร็ว** (webp, ขนาดเหมาะสม, lazy-load)
- ให้ความสำคัญกับ **Performance และ Accessibility** เป็นอันดับต้น

## 16. Code Quality
- **แยก component อย่างเหมาะสม** — หนึ่ง component หนึ่งหน้าที่
- **ตั้งชื่อ component และ variable ให้สื่อความหมาย**
- **หลีกเลี่ยง component ที่ใหญ่เกินไป** (แตกย่อย)
- **ลดการเขียนข้อมูลซ้ำ** — ใช้ **array + mapping** สำหรับข้อมูลที่มีโครงสร้างซ้ำ (ผลงาน, บริการ, ใบรับรอง ฯลฯ)
- **ห้ามใช้ `any`** — กำหนด type ให้ครบ (TypeScript strict)
- **ห้ามเขียน inline style โดยไม่มีเหตุผล** — ใช้ Tailwind/utility/token
- **ไม่สร้าง design system ที่ซับซ้อนเกินจำเป็น** — พอดีกับงาน
- **Code อ่านง่าย พร้อมนำไปพัฒนาต่อ**

## 17. Final Verification (ก่อนส่งงาน)
ตรวจสอบเว็บด้วยตัวเองที่ขนาดจอ: **Mobile 375px · Tablet 768px · Desktop 1440px**

ตรวจและแก้:
- [ ] Responsive layout ถูกต้องทุกจอ
- [ ] Spacing สม่ำเสมอ
- [ ] Typography (ขนาด/ลำดับชั้น) ถูกต้อง
- [ ] Contrast ผ่าน
- [ ] ไม่มี overflow (แนวนอน/ล้น container)
- [ ] ไม่มี broken interaction (ปุ่ม/ลิงก์/เมนู/แชต)
- [ ] Accessibility (keyboard, focus, heading, alt)
- [ ] Visual consistency ทั้งเว็บ
- [ ] ไม่มี console errors

---
*หมายเหตุ: เอกสารนี้อ้างอิงโครงสร้างและฟีเจอร์ที่สังเกตจาก bigzweb.com เพื่อเป็นแนวทาง ไม่ได้คัดลอกเนื้อหา/ดีไซน์โดยตรง — Art Direction (Editorial Minimalism × Swiss × Liquid Glass) เป็นของ T4 Labs เอง*

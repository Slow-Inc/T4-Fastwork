# Requirement Document 2 — เว็บไซต์เอเจนซี / พอร์ตโฟลิโอ T4 Labs

> ⚠️ **SUPERSEDED:** เอกสารนี้ถูกแทนที่แล้วโดย **`requirement3.md` (v3)** ซึ่งต่อยอด Layered Immersive Swiss System ด้วย Brand Robot Character + Visual Storytelling + Dual Theme (Dark/Light) — งานใหม่ทั้งหมดให้ยึด v3
>
> เอกสารความต้องการสำหรับพัฒนาเว็บไซต์รับทำเว็บ/เอเจนซี พร้อมระบบโชว์ผลงานและผู้ช่วย AI แนะนำงาน
> **Tech stack เป้าหมาย:** Framework สมัยใหม่ (Next.js + Backend/DB)
> เวอร์ชัน 2.0 · ปรับ Art Direction เป็น Layered Immersive Swiss System

---

## 1. ภาพรวมโปรเจกต์ (Project Overview)

### 1.1 วัตถุประสงค์

เว็บไซต์สำหรับทีมพัฒนาซอฟต์แวร์ (T4 Labs) ที่รับสร้าง **ตั้งแต่ Landing  SaaS, Web Application และ AI Product** ให้กับ รายย่อย, startup และองค์กร โดยวางตัวเป็นพาร์ตเนอร์ด้านเทคนิคระดับพรีเมียม ไม่ใช่ร้านรับทำเว็บทั่วไป เป้าหมายหลักคือ

- สื่อสาร positioning ว่าเป็น **product engineering partner** ที่รับได้ครบสเปกตรัม — ตั้งแต่ Landing Page, POS ทั่วไป ไปจนถึงระบบ/แพลตฟอร์มที่ซับซ้อนสูง สเกลใหญ่ เสถียร รองรับผู้ใช้จำนวนมาก
- นำเสนอความเชี่ยวชาญเชิงลึก (Full-Stack + AI) ให้ดูน่าเชื่อถือด้วยผลงาน + ใบรับรอง (social proof)
- โชว์ผลงาน (portfolio) แบบมีหมวดหมู่ ค้นหาและกรองตามเทคโนโลยีได้
- มีผู้ช่วย AI (chatbot) ช่วยคุยโจทย์ทางเทคนิคและแนะนำเคสงานที่ใกล้เคียง
- แปลง traffic เป็น qualified lead → นัดคุย/ส่งบรีฟ → ช่องทางจ้างงาน (Fastwork หรือฟอร์ม/นัดหมาย)

### 1.2 กลุ่มเป้าหมาย (Target Audience)

กลุ่มเป้าหมายหลักเป็น B2B + B2C / decision-maker สายเทคโนโลยี + คนทั่วไปที่อยากมี Website:

- **Founder / Startup** — ต้องการสร้าง MVP หรือ product จริงเพื่อ launch/ระดมทุน
- **SME / บริษัท** ที่ต้องการ digital transformation หรือระบบภายในที่ปรับแต่งเอง
- องค์กรที่ต้องการ **SaaS platform** (multi-tenant, subscription, dashboard)
- ธุรกิจที่ต้องการ **Web Application** ระบบซับซ้อน (marketplace, booking, internal tools)
- ธุรกิจที่ต้องการ **AI Product** (chatbot, RAG, OCR/Document AI, automation)
- คนปกติที่ต้องการ Website ง่ายๆ เช่นแนะนำสินค้า, ร้านค้า, จนถึงระบบจัดการต่างๆ

**Persona ที่ต้องโน้มน้าว:** Founder/CTO/Product Owner ที่มองหาความน่าเชื่อถือทางเทคนิค (stack, ความปลอดภัย, สเกล, ประสบการณ์) มากกว่าราคาถูกที่สุด — เนื้อหาและ tone ต้องพูดภาษาเดียวกับคนสายเทคแต่ก็ต้องทำให้คนทั่วไปเข้าใจได้ง่ายด้วย

### 1.3 เป้าหมายเชิงธุรกิจ (Business Goals / KPI)

- เพิ่มจำนวนการติดต่อ/จ้างงาน (conversion rate ของปุ่ม "ติดต่อ/จ้างงาน")
- เพิ่มเวลาเฉลี่ยบนหน้าเว็บ และจำนวนหน้า/เซสชัน
- อัตราการใช้งาน AI chat ต่อผู้เข้าชม
- อันดับ SEO สำหรับคีย์เวิร์ด "รับทำเว็บไซต์" และคำที่เกี่ยวข้อง
- สื่อสารถึงคุณภาพงานที่เราสามารถทำได้ให้คนสาย Tech เข้าใจแต่ก็ยังทำให้คนปกติที่ไม่ใช่สาย Tech เข้าใจได้ง่ายและมั่นใจในตัวเราด้วย

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
   - แถบตัวเลขความน่าเชื่อถือ: ประสบการณ์ 5 ปี, ทำมาแล้ว 21+ โปรเจกต์ (ทีม + ส่วนตัว), เชี่ยวชาญงานระบบ
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

| # | หน้า                             | Role          | คำอธิบาย                                                                                         | UI Components                                                                                                                                                                                            |
| - | ------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Login / Auth                         | ทุกคน    | Login Email/Password หรือ Social พร้อม Forgot Password + 2FA                                    | ช่องอีเมล/รหัสผ่าน · ปุ่มเข้าสู่ระบบ · Social login · ลืมรหัสผ่าน · ยืนยัน 2FA                                                                      |
| 2 | Notification                         | ทุกคน    | รายการแจ้งเตือน กรองตามประเภท อ่าน/ยังไม่อ่าน + ตั้งค่า | ตัวกรองประเภท · รายการแจ้งเตือน · สถานะอ่าน/ยังไม่อ่าน · ตั้งค่าการแจ้งเตือน                                                        |
| 3 | Dashboard หลัก                   | Admin/User    | ภาพรวมข้อมูลหลัก                                                                         | การ์ด KPI · กราฟแนวโน้ม · ตารางล่าสุด · shortcut เมนู                                                                                                                  |
| 4 | จัดการข้อมูล (CRUD)      | Admin/Staff   | เพิ่ม/แก้/ลบ/ค้นหาข้อมูล                                                            | ค้นหา/กรอง · ปุ่มเพิ่ม · ตารางข้อมูล · bulk action · pagination                                                                                                         |
| 5 | รายงาน (Report)                | Admin/Manager | สรุปข้อมูลเป็นกราฟ + export                                                            | ตัวกรองช่วงเวลา · กราฟ Bar/Line · กราฟ Pie · Export Excel/PDF                                                                                                                  |
| 6 | Audit Log / ประวัติ           | Admin         | ประวัติกิจกรรมในระบบ                                                                 | ค้นหา/กรอง · ไทม์ไลน์ · ผู้ใช้ & เวลา · ประเภท action                                                                                                                |
| 7 | ตั้งค่าระบบ (Settings)    | Admin         | ตั้งค่าระบบตามหมวด                                                                     | เมนูหมวด · ฟอร์มตั้งค่า · สวิตช์เปิด/ปิด · ปุ่มบันทึก (ทั่วไป · แจ้งเตือน · ความปลอดภัย · API Keys · สำรองข้อมูล) |
| 8 | API & Integration                    | Admin         | จัดการ API keys + webhook                                                                          | รายการ API Keys (Production/Test/Mobile) · สถานะ Webhook · คัดลอก/รีเซ็ต · log การเชื่อมต่อ                                                                        |
| 9 | จัดการผู้ใช้ (User Mgmt) | Admin         | จัดการบัญชี + สิทธิ์                                                                    | ค้นหา · ตารางผู้ใช้ (ผู้ใช้ · Role · สถานะ) · กำหนด Role/สิทธิ์ · เปิด/ปิด account                                                                     |

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

**About (`/about`)** — โครง 7 บล็อก:

1. หัวข้อหลัก: ทีม Full-Stack + AI, ประสบการณ์, จำนวนผลงาน
2. สิ่งที่เราทำ: ประเภทงานที่รับ (SaaS, Web App, AI/แชทบอท/automation, ระบบภายใน)
3. ทำไมต้องเลือกเรา: 4 จุดขาย (ผลงานจริง / คุยกับ dev ตรง / เน้นผลลัพธ์ธุรกิจ / ดูแลหลังส่งมอบ)
4. ขั้นตอนการทำงาน 4 ขั้น (มุมมองลูกค้า): บอกความต้องการ → ประเมินขอบเขต+ราคา → ออกแบบและพัฒนา → ส่งมอบ ทดสอบ ดูแลต่อ
5. **SDLC ที่ใช้จริง** (มุมมองวิศวกรรม, 6 เฟส): Requirement Analysis → Design & Architecture → Development
   (Agile, TDD สำหรับ logic สำคัญ, code review ทุก PR) → Testing & QA (unit + E2E ก่อน merge ทุกครั้ง, UAT ร่วมลูกค้า)
   → Deployment (CI/CD, staging ก่อน production, มีแผน rollback) → Maintenance & Support — เสริมความน่าเชื่อถือ
   ด้านวิศวกรรมให้กลุ่มเป้าหมายที่เป็น CTO/technical founder โดยเฉพาะ (แยกจากข้อ 4 ที่เป็นมุมมองลูกค้า)
6. **ทีม (Team)** — โปรไฟล์รายคนจริง 6 คน (ชื่อ/ตำแหน่งจาก README ของ github.com/Slow-Inc, สกิล/tech
   stack/การศึกษา/certificate เป็นข้อมูลจริงของแต่ละคน **ไม่ merge รวมกัน**) — คนที่ไม่ใช่สาย dev (เช่น
   Project Manager) จะไม่มี tech stack แสดง ไม่ fabricate ให้
7. **ส่วน Certificate (ดูข้อ 4.7)** + CTA (Fastwork / คุยกับ AI / ลิงก์ FAQ)

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

| # | หลักสูตร                          | ผู้ออก (Issuer)                                                  |
| - | ----------------------------------------- | ---------------------------------------------------------------------- |
| 1 | AI for All: From Basics to GenAI Practice | NVIDIA                                                                 |
| 2 | Basic Data Analytics Workshop             | SIIT มหาวิทยาลัยธรรมศาสตร์                        |
| 3 | Entrepreneurial Mindset                   | ตลาดหลักทรัพย์แห่งประเทศไทย (SET)           |
| 4 | GenAI for Application Developers          | Coursera                                                               |
| 5 | Cyber Security Awareness                  | สถาบันพัฒนาบุคลากรภาครัฐด้านดิจิทัล |
| 6 | AI Governance & Ethics                    | สถาบันพัฒนาบุคลากรภาครัฐด้านดิจิทัล |
| 7 | Road to Data Scientists                   | Microsoft & JA Thailand                                                |

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
- ปุ่มตอบสนอง:| ปุ่ม                                     | พฤติกรรม                                                                      |
  | -------------------------------------------- | ------------------------------------------------------------------------------------- |
  | เอาเลย พาชมหน่อย              | นำทางไปหน้า `/chat`                                                      |
  | คุยกับเรา                           | นำทางไปหน้า `/chat` เช่นเดียวกัน                             |
  | ไว้ก่อน                               | ปิดข้อความทักทาย ไม่นำทางออกจากหน้าปัจจุบัน |
  | ไอคอน X (มุมขวาบนของ bubble) | ปิดข้อความทักทายทันที                                            |

**แผงสรุปขอบเขตงาน (Scope Summary Panel, FR-08) — เฉพาะหน้า `/chat`:**

- ไอคอนเอกสารลอยมุมขวาล่างของจอตลอดเวลาขณะอยู่หน้า `/chat`
- เมื่อ hover/คลิกก่อนเริ่มคุย แสดง tooltip: "เริ่มพูดคุยกับ AI ระบบจะสรุปขอบเขตงานให้อัตโนมัติ"
- เมื่อมีบทสนทนาแล้ว แผงจะอัปเดตอัตโนมัติเป็นสรุป: ประเภทงาน, งบประมาณเบื้องต้น (ช่วงราคา), ระยะเวลา (ประเมินหลังสรุปขอบเขตงาน), requirement เด่นที่จับใจความได้จากบทสนทนา
- สกัดข้อมูลด้วย LLM เรียกแบบ non-streaming แยกจากการตอบแชทหลัก อ้างอิงจาก log บทสนทนาของ session นั้น ๆ เท่านั้น (ไม่สร้างข้อมูลเท็จ)

**FR สรุปเพิ่มเติม:**

| ID    | รายละเอียด                                                                                                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | ระบบต้องแสดงป๊อปอัพทักทายพร้อมปุ่ม 3 แบบตามที่ระบุ เฉพาะการเข้าชมครั้งแรก                              |
| FR-02 | ปุ่ม "เอาเลย พาชมหน่อย" และ "คุยกับเรา" ต้องนำทางไปหน้า `/chat`                                                             |
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

| ID    | รายละเอียด                                                                                                                                                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-09 | ปุ่ม "ถามรายละเอียดผลงานนี้กับ AI" ต้องพาไป `/chat` พร้อมอ้างอิงผลงานนั้น และคำตอบของ AI ต้องอ้างอิงข้อมูลผลงานจริงเสมอ (deterministic, ไม่ใช่แค่ผลลัพธ์จาก semantic search) |

---

## 6. โมเดลข้อมูล (Data Model)

### 6.1 Project

| ฟิลด์     | ชนิด        | หมายเหตุ                                |
| -------------- | --------------- | ----------------------------------------------- |
| id             | uuid/int        | PK                                              |
| slug           | string (unique) | ใช้ใน URL                                  |
| title          | string          |                                                 |
| title_en       | string          | สำหรับ EN                                 |
| description    | text            | คำอธิบายสั้น                        |
| content        | rich text       | รายละเอียดเต็ม                    |
| category_id    | FK              | หมวดหลัก                                |
| business_types | array           | ประเภทที่ recommend (ecommerce ฯลฯ) |
| tags           | array           | คีย์เวิร์ด                            |
| technologies   | array/relation  | เทคโนโลยีที่ใช้                  |
| snapshot_image | url             | ภาพปก                                      |
| gallery        | array           | ภาพเพิ่มเติม                        |
| video_url      | url (nullable)  | วิดีโอแนะนำ                          |
| live_url       | url (nullable)  | ลิงก์เว็บจริง                      |
| is_featured    | bool            | แสดงใน carousel                           |
| published_at   | datetime        |                                                 |
| sort_order     | int             |                                                 |

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

| ฟิลด์  | ชนิด       | หมายเหตุ                            |
| ----------- | -------------- | ------------------------------------------- |
| id          | uuid/int       | PK                                          |
| title       | string         | ชื่อหลักสูตร                    |
| title_en    | string         | สำหรับ EN                             |
| issuer      | string         | ผู้ออก เช่น NVIDIA, Coursera, SET |
| issuer_logo | url (nullable) | โลโก้ผู้ออก                      |
| issued_year | int/date       | ปีที่ได้รับ                      |
| thumbnail   | url            | ภาพย่อสำหรับการ์ด          |
| full_image  | url            | ไฟล์ใบเต็ม (jpg/png/webp/pdf)     |
| verify_url  | url (nullable) | ลิงก์ตรวจสอบ (ถ้ามี)       |
| is_featured | bool           | โชว์บนหน้าแรกด้วยไหม    |
| sort_order  | int            | ลำดับการแสดง                    |

### 6.9 PreviewScreen (Interactive Preview — ข้อ 4.4.1)

| ฟิลด์    | ชนิด                   | หมายเหตุ                                    |
| ------------- | -------------------------- | --------------------------------------------------- |
| id            | uuid/int                   | PK                                                  |
| title         | string                     | ชื่อหน้า เช่น "Login / Auth"            |
| roles         | array                      | Role ที่เข้าถึง เช่น ["admin","user"] |
| description   | string                     | คำอธิบายสั้น 1 บรรทัด             |
| components    | array                      | รายการ UI component ในหน้า              |
| view          | enum(`client`,`admin`) | มุมมอง                                        |
| style_variant | enum(1,2,3)                | สไตล์ mockup                                   |
| mockup_image  | url                        | ภาพต่อ (view × style)                        |
| sort_order    | int                        | ลำดับใน preview                              |

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
- [ ] User สามารถเข้าใจถึงความ Professional เราทันทีและรวมถึงผลงาน ความสามารถในหน้า Home แต่รายละเอียดไม่เยอะเกินไปจน User ขี้เกียจอ่าน

---

## 13. คำถามที่ต้องเคลียร์ก่อนเริ่ม (Open Questions)

- ใช้ LLM เจ้าไหน และงบ token ต่อเดือนเท่าไร?
- เนื้อหา EN แปลเองหรือใช้ระบบแปล?
- จัดการผลงานผ่าน headless CMS สำเร็จรูป หรือเขียน admin เอง?
- ช่องทางจ้างงานหลักใช้ platform ภายนอกหรือฟอร์มบนเว็บ?
- ต้องเก็บข้อมูลติดต่อลูกค้า (PDPA) หรือไม่ ต้องมีนโยบายความเป็นส่วนตัว

---

## 14. Design & Art Direction — Layered Immersive Swiss System

> **Style statement (ข้อกำหนดหลัก):** Editorial Minimalism × Modern Swiss × Liquid Glass × Visible Grid × 3D and Immersive Elements × Motion Design and Animation × Tech Craft
>
> ใช้ **3D and Immersive Elements เป็นฐานชั้นแรก** · ใช้ **Modern Swiss Design เป็นฐานชั้นที่ 2** · ใช้ **Liquid Glass แทรกใน component ที่เหมาะสม** · ใช้ **Visible Grid ได้อย่างอิสระ โดยเฉพาะ background และ Blueprint** · กระจาย **Motion Design และ Animation ตั้งแต่ระดับ section ถึง micro-interaction** เพื่อแสดงความใส่ใจในรายละเอียด · ใช้ **Tech Craft** เป็นมาตรฐานควบคุมคุณภาพของทุกชั้น

### 14.0 Visual Thesis & Non-negotiable Hierarchy

**Visual thesis:**

> พื้นที่ดิจิทัลสำหรับ Founder, CTO และ Product Owner ที่พาผู้ใช้สำรวจความสามารถของ T4 Labs ผ่านโลก 3D เชิงวิศวกรรม จัดระเบียบข้อมูลด้วยความแม่นยำแบบ Swiss และควบคุมระบบผ่าน interface แบบ Liquid Glass ที่สร้างอย่างประณีตในระดับ micro

ภาษาภาพทุกชั้นต้องมีหน้าที่เฉพาะ ห้ามใช้เพียงเพราะเป็น trend:

| ลำดับ | ชั้นการออกแบบ | หน้าที่หลัก | สิ่งที่ต้องไม่เกิด |
| --- | --- | --- | --- |
| **Layer 1** | **3D & Immersive Elements** | สร้างโลก ความลึก วัสดุ แสง และ spatial narrative | วางโมเดล 3D เป็นของตกแต่งโดยไม่มีความหมาย |
| **Layer 2** | **Modern Swiss Design** | จัด information architecture, typography, alignment และ hierarchy | ปล่อยให้ 3D ทำให้โครงสร้างข้อมูลอ่านยาก |
| **Interface layer** | **Liquid Glass** | เป็นพื้นผิวควบคุม/ข้อมูลที่ลอยเหนือโลก 3D | เปลี่ยนทุก card ให้เป็น glassmorphism |
| **Spatial guide** | **Visible Grid / Blueprint** | อธิบายสเกล ตำแหน่ง ความสัมพันธ์ และระบบ | ใช้ grid เป็น texture รบกวนการอ่านทุกพื้นที่ |
| **Behavior layer** | **Motion Design & Animation** | อธิบายเหตุ–ผล การเปลี่ยนสถานะ และ spatial relationship | ทำทุกอย่างเคลื่อนไหวพร้อมกัน |
| **Quality lens** | **Tech Craft** | ทำให้รายละเอียดทุกจุดแม่น มีเหตุผล และตรวจสอบได้ | ใช้ technical chrome หรือ fake data เพื่อให้ดูไฮเทค |
| **Restraint rule** | **Editorial Minimalism** | ควบคุมความหนาแน่น ตัดสิ่งไม่จำเป็น และรักษา focal point | ทำ minimalism จนข้อมูลสำคัญหายหรือหน้าเว็บว่างเปล่า |

**กฎสูงสุด:**

- หนึ่ง viewport หรือหนึ่ง section มี dominant element ได้เพียงหนึ่งกลุ่ม
- เมื่อ 3D เด่น Typography และ UI ต้องนิ่ง; เมื่อ Typography เด่น 3D ต้องลดรายละเอียด
- Visual effect ทุกชิ้นต้องสนับสนุน comprehension, interaction, brand recognition หรือ spatial continuity อย่างน้อยหนึ่งข้อ
- **อนุญาตและสนับสนุนการใช้ขอบมน** เพื่อสร้างภาพลักษณ์ modern, digital และ futuristic โดยต้องใช้เป็นระบบตามประเภทและลำดับชั้นของ component ไม่จำเป็นต้องทำทุกพื้นผิวเป็นเหลี่ยมเพื่อให้ดู technical
- ภาษารูปทรงต้องผสม **precision geometry × soft technological surfaces**: โครงสร้างและ alignment ยังแม่นแบบ Swiss แต่ panel, control, media frame และ 3D material สามารถโค้งมนเพื่อให้ภาพรวมดูเป็นเทคโนโลยีร่วมสมัย ไม่ดิบหรือ craft-heavy เกินไป
- ถ้านำ grid, mono label และเส้น technical ออก งานยังต้องถูกจดจำว่าเป็น T4 Labs จาก spatial motif, typography และวิธีเล่า product
- ห้ามให้ style ใดแข่งขันกับเนื้อหาและ CTA หลัก

### 14.1 Brand Personality & Voice

บุคลิกหลัก:

- **Engineering-led** — ดูเป็นทีมที่เข้าใจ architecture, reliability, security และ scale จริง
- **Precise** — alignment, timing, copy และ state ต้องแม่น
- **Inventive** — กล้าใช้ 3D, spatial composition และ interaction ที่ไม่เหมือน template
- **Calm confidence** — ไม่ใช้คำขายเกินจริงหรือ visual effect เพื่อชดเชยหลักฐาน
- **Human partner** — คนทั่วไปเข้าใจได้ ขณะเดียวกันคนสายเทคเห็นความลึก
- **Crafted, not rustic** — รายละเอียดเล็ก เช่น cursor response, focus state, label transition และ loading behavior ต้องได้รับการออกแบบ แต่ภาพรวมต้องสะอาด ลื่น และล้ำสมัย ไม่เน้นความดิบแบบ workshop หรือ blueprint จนกลบความเป็น digital product

Tone of voice:

- ไทยเป็นหลัก อังกฤษรอง และสลับภาษาได้
- ใช้ active voice, ประโยคสั้น และคำที่ลูกค้าเข้าใจ
- ใช้ศัพท์เทคนิคเมื่อช่วยตัดสินใจ พร้อมคำอธิบายภาษาคน
- ใช้หลักฐานเฉพาะเจาะจง เช่นชื่อระบบ stack และกระบวนการจริง
- ห้ามใช้ marketing copy กว้าง ๆ เช่น “Revolutionize your business” หรือ claim ที่ตรวจสอบไม่ได้

### 14.2 Layer 1 — 3D & Immersive Elements

3D คือ **world-building layer** และเป็นจุดเริ่มต้นของ visual system ไม่ใช่ asset เสริมภายหลัง

**บทบาทของ 3D:**

- สร้าง spatial thesis ใน Hero ให้ผู้ใช้รับรู้ทันทีว่า T4 Labs ทำงานระดับ product/system
- ใช้ depth อธิบาย layer ของระบบ เช่น Client → Edge → API → Data → AI
- แสดง relationship, flow, scale, state และ transformation ที่ภาพ 2D อธิบายได้ไม่ดีเท่า
- เชื่อม section ผ่านมุมกล้อง วัสดุ เส้น trace หรือ object continuity โดยไม่ต้องวางโมเดลใหม่ทุก section
- ใช้ project evidence จริง เช่น product UI, architecture layer, device frame หรือ data flow เป็นวัสดุของฉาก

**แนวทางองค์ประกอบ:**

- Hero ควรมี signature object เช่น **Product Reactor / Exploded Product Stack** ที่สื่อการประกอบ product จากหลายชั้น
- แบ่ง depth เป็น foreground control, midground content และ background world อย่างชัดเจน
- ใช้วัสดุแนว machined metal, smoked glass, wireframe, translucent technical film และ signal light อย่างมีวินัย
- แสงต้องมีทิศทางและตรรกะเดียวกันทั้ง scene; ห้าม glow รอบทุก object
- 3D label, annotation และ coordinate ต้องผูกกับตำแหน่งจริง ไม่ลอยแบบสุ่ม
- ใช้ perspective, occlusion และ scale เพื่อสร้าง hierarchy ไม่ใช่ใช้ blur อย่างเดียว
- 3D ที่เป็น decorative ต้อง `aria-hidden="true"`; 3D ที่สื่อข้อมูลต้องมีข้อความหรือ diagram 2D ทดแทน

**Interaction:**

- Pointer movement: ตอบสนองแบบจำกัดองศาและมี damping ไม่ตาม cursor แบบฉับพลัน
- Scroll: ใช้ camera move, exploded layer, focus shift หรือ assembly/disassembly เพื่อเล่าเรื่อง
- Hover/focus: highlight เฉพาะ node หรือ layer ที่สัมพันธ์กับข้อมูล
- Touch: ใช้ tap/drag ที่มี single-pointer alternative และไม่ขัดกับ vertical scroll
- ผู้ใช้ต้องเข้าถึงข้อมูลและ CTA ได้ครบแม้ไม่ interact กับ 3D

#### 3D Model Play & Direct Manipulation

ต้องมี 3D Model หลักอย่างน้อยหนึ่งจุดที่ผู้ใช้สามารถ **เล่นและควบคุมได้โดยตรง** ไม่ใช่เป็น animation ที่ดูได้อย่างเดียว เพื่อสร้างความรู้สึก immersive, playful และแสดงความใส่ใจด้าน interaction craft

**Core interactions ขั้นต่ำของ Signature Model:**

- **Grab / Drag to Rotate** — จับและหมุนโมเดลได้อย่างอิสระภายในองศาที่กำหนด พร้อม inertia/damping ที่เป็นธรรมชาติ
- **Hotspot Selection** — คลิก แตะ หรือใช้ keyboard เลือกส่วนประกอบ เพื่อ highlight และเปิดคำอธิบายที่สัมพันธ์กับ product/system
- **Explode / Assemble** — แยกชิ้นส่วนและประกอบกลับเพื่ออธิบาย layer เช่น Client, Edge, API, Data และ AI
- **Reset View** — มีปุ่มคืนมุมกล้องและสถานะเริ่มต้นที่หาเจอง่าย

**Interaction เสริมที่เลือกใช้ได้:**

- Zoom แบบจำกัดระยะด้วย wheel, pinch หรือปุ่ม `+ / −`
- Orbit camera และ snap ไปยัง front, side, top หรือ detail view
- เปิด–ปิด layer หรือ isolate เฉพาะส่วนของโมเดล
- สลับ material mode เช่น Solid, Glass, Wireframe, X-ray หรือ Blueprint
- เปลี่ยน configuration ของโมเดลเพื่อเปรียบเทียบ Landing, Web App, SaaS และ AI Product
- Drag component ไปวางในตำแหน่งที่ถูกต้อง หรือประกอบ product stack แบบ mini interaction
- Physics response แบบเบา เช่นชิ้นส่วนขยับ ชน หรือกลับเข้าตำแหน่งเดิม แต่ต้องควบคุมผลลัพธ์ได้
- Easter egg หรือ hidden response เมื่อหมุน/เลือกตามเงื่อนไข เพื่อสร้าง delight โดยไม่ซ่อนข้อมูลหรือ action สำคัญ
- Sound/haptic feedback ใช้ได้แบบ opt-in เท่านั้น ต้องมี mute และไม่เล่นอัตโนมัติ

**Interaction feedback:**

- Cursor และ affordance ต้องสื่อว่าโมเดลจับ หมุน เลือก หรือ zoom ได้
- แสดง onboarding hint สั้น ๆ เช่น “Drag to rotate · Tap a node” และซ่อนได้หลังผู้ใช้เข้าใจ
- ส่วนที่ hover/focus/selected ต้องต่างกันทั้ง light, outline, position หรือ label ไม่ใช้สีเพียงอย่างเดียว
- ขณะลากต้องแยก state จาก hover และป้องกัน text selection ที่ไม่ตั้งใจ
- การเลือกชิ้นส่วนต้องเชื่อมกับ Liquid Glass tooltip/panel หรือ Swiss information block ที่อ่านง่าย
- Animation หลังปล่อยควร settle อย่างนุ่มนวลและไม่หมุนต่อเนื่องจนควบคุมไม่ได้
- ต้องมีสถานะ `idle`, `hint`, `hover/focus`, `dragging`, `selected`, `exploded`, `loading`, `error` และ `fallback` ตามความเกี่ยวข้อง

**Input & accessibility:**

- Desktop: mouse/pointer drag, wheel และ keyboard control
- Touch: one-finger rotate, pinch zoom และปุ่มควบคุมที่เป็นทางเลือก; ต้องไม่แย่ง vertical page scroll
- Keyboard: เลือก hotspot ด้วย Tab/arrow ตามความเหมาะสม, Enter/Space เพื่อ activate และ Escape เพื่อออกจาก selection
- มี accessible name และข้อความอธิบาย control ทุกตัว
- ข้อมูลที่เปิดจาก hotspot ต้องเข้าถึงได้ในรูป list/accordion หรือ schematic 2D โดยไม่ต้องควบคุมโมเดล
- เมื่อใช้ `prefers-reduced-motion: reduce` ให้เปลี่ยนจาก free camera animation เป็น snap state หรือ instant transition
- บน low-power device ให้ลด physics, post-processing และ interaction complexity แต่ยังคง rotate/select/reset

**กฎการใช้งาน:**

- การเล่นกับโมเดลต้องสนับสนุนการเข้าใจบริการ ระบบ หรือความสามารถของทีม ไม่กลายเป็นเกมที่แยกจากเป้าหมายของหน้า
- ห้ามบังคับให้ผู้ใช้เล่นโมเดลก่อนเห็น value proposition หรือเข้าถึง CTA
- ห้าม hijack scroll, pointer หรือ gesture ทั้งหน้า
- ต้องมีขอบเขต zoom/rotation เพื่อไม่ให้โมเดลหายจากฉากหรือกล้องเข้าไปใน geometry
- Interaction ต้องคืนสถานะได้เสมอและไม่ทำให้ผู้ใช้ติดอยู่ใน mode ใด mode หนึ่ง
- บันทึก analytics ได้เฉพาะ event สำคัญ เช่น first interaction, hotspot opened และ model reset โดยไม่เก็บข้อมูลส่วนบุคคลเกินจำเป็น

**ข้อจำกัด:**

- หนึ่ง viewport มี 3D focal scene หลักได้หนึ่งฉาก
- ห้ามใช้ 3D object เป็น floating decoration ซ้ำ ๆ ทั่วหน้า
- 3D ต้องไม่ทำให้ข้อความสำคัญ contrast ลดลงหรือถูกบัง
- ต้องมี static/CSS fallback เมื่อ WebGL ไม่พร้อม, GPU ต่ำ หรือโหลด asset ไม่สำเร็จ
- ห้ามให้ 3D block LCP หรือทำให้ layout shift
- asset หนักต้อง lazy-load หลัง critical content และใช้ compressed geometry/texture

### 14.3 Layer 2 — Modern Swiss Information Architecture

Swiss Design ทำหน้าที่เป็น **ระบบจัดระเบียบโลก 3D** ให้ผู้ใช้เข้าใจข้อมูลและเดินทางได้โดยไม่หลง

**หลักโครงสร้าง:**

- Desktop ใช้ 12-column grid; tablet 6–8 columns; mobile ใช้ 4 columnsหรือ priority stack
- กำหนด max-width ประมาณ 1280–1460px และ outer gutter ที่ตอบสนองตาม viewport
- Alignment ของ heading, body, metadata, media และ CTA ต้องอ้างอิง track ร่วมกัน
- ใช้ asymmetry อย่างมีเหตุผลเพื่อกำหนด focal point ไม่จัดทุกอย่างกึ่งกลาง
- ใช้ negative space เป็นจังหวะพักระหว่าง immersive/dense section
- ใช้ hairline, index, caption และ metadata เพื่ออธิบายลำดับและความสัมพันธ์
- section แต่ละประเภทต้องมี composition ต่างกัน แต่ใช้ token และ alignment system เดียวกัน
- body text ควรมี measure ประมาณ 45–75 ตัวอักษรต่อบรรทัด
- Heading ใหญ่ได้เมื่อเป็น thesis ของ section เท่านั้น

**Editorial sequence:**

1. ผู้ใช้เข้าใจ positioning
2. เลือกโจทย์ที่ใกล้ตัว
3. เห็นหลักฐานผลงาน
4. เข้าใจขอบเขตบริการ
5. เห็นวิธีคิดและ architecture
6. เห็นทีม/ใบรับรอง/ความน่าเชื่อถือ
7. ตัดสินใจส่ง brief หรือคุยกับ AI

ห้ามให้ความสวยงามของ 3D เปลี่ยนลำดับข้อมูลธุรกิจนี้

### 14.4 Editorial Minimalism — Restraint System

Editorial Minimalism ไม่ใช่ visual layer เพิ่มเติม แต่เป็น **กฎตัดสินใจของทุก layer**

- หนึ่ง section ต้องตอบคำถามหลักเพียงหนึ่งข้อ
- ใช้ visual hierarchy ที่ต่างกันชัด แทนการเติม card หรือ decoration
- ตัด element ที่ไม่เพิ่มข้อมูล ไม่ช่วย action และไม่สร้าง brand memory
- ใช้พื้นที่ว่างสลับกับ controlled density เพื่อให้หน้าที่ยาวยังมีจังหวะ
- ไม่ใช้ border, shadow, glass, grid, 3D และ animation พร้อมกันบน component เดียวโดยไม่มีเหตุผล
- คอนเทนต์สำคัญต้องอ่านได้แม้ปิด animation และ 3D
- ก่อนส่งแบบแต่ละหน้า ให้ลองลบ visual accessory อย่างน้อยหนึ่งรอบแล้วประเมินใหม่
- Minimalism ต้องไม่ทำให้ state, navigation, error หรือข้อมูลตัดสินใจหายไป

### 14.5 Visible Grid & Blueprint System

Visible Grid ใช้ได้อย่างอิสระ แต่ต้องมี **ระดับการมองเห็นตามหน้าที่**:

| ระดับ | ใช้เมื่อ | ตัวอย่าง |
| --- | --- | --- |
| **Visible** | ต้องการอธิบายโลก ระบบ ตำแหน่ง หรือสเกล | Hero stage, 3D workbench, system schematic, process map |
| **Quiet** | ต้องการรักษา alignment โดยไม่แย่งเนื้อหา | Project gallery, services list, tech stack, CTA |
| **Invisible** | เนื้อหาต้องการความสงบหรืออ่านต่อเนื่อง | Long-form copy, FAQ answer, blog body, form fields |

**Blueprint language:**

- ใช้ major/minor grid, baseline, coordinate, crosshair, dimension line, path trace และ node marker
- เส้น major/minor ต้องมี contrast ต่างกัน; ห้ามให้ทุกเส้นน้ำหนักเท่ากัน
- Grid ควรสัมพันธ์กับ 3D perspective หรือ container track จริง
- ใช้สี blueprint เป็น neutral technical tint ไม่ถือเป็น accent สีที่สอง
- อนุญาตให้ grid ตอบสนองต่อ pointer, scroll หรือ active node แบบเบามาก
- บนมือถือให้ลด density และตัด decorative track ที่ไม่ช่วยลำดับข้อมูล
- ห้ามวาง grid ใต้ body copy ด้วย contrast ที่ทำให้การอ่านลดลง
- ห้ามใช้ code, coordinate หรือ status ปลอมเพื่อเติมพื้นที่

### 14.6 Liquid Glass — Inserted Interface Components

Liquid Glass เป็น **interface material** ที่แทรกอยู่เหนือ 3D/immersive world ไม่ใช่พื้นผิวเริ่มต้นของทุก component

**Component ที่เหมาะสม:**

- Sticky/floating navigation
- 3D scene control, view selector และ contextual toolbar
- AI widget และ scope summary panel
- Tooltip, popover, command/search palette
- Modal, lightbox และ project detail overlay
- Floating filter/control ที่มีเนื้อหาเคลื่อนผ่านด้านหลังจริง

**Component ที่ไม่ควรใช้ Glass โดยอัตโนมัติ:**

- Project card, service card, FAQ row และ content block ทั่วไป
- ตารางหรือข้อความยาวที่ต้องการ contrast คงที่
- element ที่ไม่มี layer หรือเนื้อหาด้านหลังให้ blur
- card หลายใบที่เรียงซ้ำกันทั้ง section

**Material specification เริ่มต้น:**

- Background: dark translucent surface ประมาณ 58–72% opacity
- `backdrop-filter: blur(18–24px) saturate(125–145%)`
- Border: hairline สว่างด้านรับแสง + border มืดด้านตรงข้าม
- Shadow: เบาและกว้าง ใช้เพื่อแยก spatial layer ไม่ใช้เพื่อทำให้ทุก card ลอย
- Specular highlight: เคลื่อนตาม pointer ได้เฉพาะ component สำคัญและต้องละเอียดอ่อน
- Radius: ใช้ได้ตั้งแต่เล็กถึงใหญ่ตาม hierarchy; panel และ floating surface สามารถมนชัดเพื่อให้ดู modern/futuristic ขณะที่ data table, schematic และ structural divider อาจคมกว่า
- Rounded rectangle, capsule และ curved glass อนุญาตเมื่อรูปทรงสื่อ containment, interaction, touch target หรือ spatial layer อย่างชัดเจน
- ห้ามใช้ radius ค่าเดียวกับทุก component หรือทำทุก block เป็น rounded card จน hierarchy หาย
- Fallback: solid/near-opaque surface ที่ contrast ผ่านเมื่อ browser ไม่รองรับ blur
- จำกัดจำนวน glass surface ที่เด่นพร้อมกันในหนึ่ง viewport เพื่อไม่ให้โลก 3D แตกเป็นหลายชั้นจนอ่านยาก

### 14.7 Color & Material Tokens

ใช้ dark immersive canvas เป็นฐานเพื่อให้ depth, light และ glass มีความหมาย โดย token ต่อไปนี้เป็น **starting system** ที่ปรับค่าได้ระหว่างทำ visual QA แต่ห้ามเปลี่ยนบทบาทโดยไม่มีเหตุผล:

| Token | ค่าเริ่มต้น | หน้าที่ |
| --- | --- | --- |
| `void` | `#080A0C` | Canvas หลัก / ฉาก 3D |
| `void-raised` | `#0D1114` | Surface ชั้นยก |
| `panel` | `#11171A` | Solid content/control surface |
| `ink` | `#F1F1EA` | ข้อความหลัก |
| `ink-soft` | `#B6B8B2` | Body/caption รอง |
| `ink-faint` | `#787D7A` | Metadata ที่ไม่สำคัญ |
| `signal` | `#FF6846` | CTA, active state, trace, focus |
| `blueprint-line` | `rgba(140,176,188,.13)` | Grid/technical guide |
| `glass` | `rgba(13,17,20,.64)` | Floating interface material |
| `line` | `rgba(220,232,228,.16)` | Hairline และ divider |

**กฎสี:**

- `signal` เป็น accent หลักเพียงสีเดียว
- สี blueprint เป็น structural neutral ไม่ใช้กับ CTA หรือ state สำคัญ
- สี success, warning และ error อนุญาตเฉพาะ semantic state และต้องไม่กลืนกับ signal
- ไม่ใช้ gradient ม่วง–น้ำเงิน–ชมพูหรือ mesh gradient เป็นพื้นหลังหลัก
- แสง 3D ต้อง derive จาก token เดียวกันเพื่อไม่ให้ scene กับ UI ดูเป็นคนละระบบ
- ใช้ grain/noise ระดับต่ำมากได้เพื่อเพิ่ม materiality แต่ต้องไม่ลดความคมของตัวอักษร

#### Shape & Radius System

ขอบมนเป็นส่วนหนึ่งของ art direction อย่างชัดเจน เพื่อสร้างสมดุลระหว่าง **Swiss precision**, **immersive technology** และ **ความเป็น modern digital product**

| Token | ช่วงค่าเริ่มต้น | ใช้กับ |
| --- | --- | --- |
| `radius-xs` | 2–4px | Hairline control, technical label, compact data cell |
| `radius-sm` | 6–10px | Button, input, chip, small control |
| `radius-md` | 12–18px | Project media, card, filter panel, navigation surface |
| `radius-lg` | 20–32px | Liquid Glass panel, AI widget, modal, immersive viewport |
| `radius-xl` | 36px ขึ้นไป | Hero object/frame หรือ signature surface ที่ต้องการความล้ำสมัย |
| `radius-full` | 999px | Toggle, status, avatar, compact pill ที่มีหน้าที่จริง |

**หลักการใช้:**

- Radius ต้องเพิ่มตาม spatial elevation หรือความเป็น interactive surface ไม่ใช่ตามความชอบแบบสุ่ม
- Component ที่อยู่ใน family เดียวกันใช้ radius token เดียวกัน
- อนุญาตให้ใช้ asymmetric/mixed corner เช่นมุมหนึ่งคม อีกมุมหนึ่งมน เมื่อสัมพันธ์กับทิศทางการเคลื่อนที่ การประกอบ 3D หรือ visual hierarchy
- ใช้ curved silhouette, chamfer และ soft bevel กับ 3D object เพื่อให้ดู precision-manufactured และ futuristic
- Content card สามารถมีขอบมนได้ แต่ต้องมีความแตกต่างด้าน span, density, composition หรือ hierarchy ไม่เรียงเป็นกล่องเหมือนกันทั้งหมด
- ใช้ border, shadow, glow และ radius ร่วมกันอย่างพอดี; ไม่จำเป็นต้องเปิดทุก effect บนพื้นผิวเดียว
- ตรวจ clipping ของ focus ring, media, tooltip และ animation เมื่อ parent มี `border-radius` และ `overflow: hidden`
- บนมือถือสามารถเพิ่ม radius และพื้นที่สัมผัสเพื่อให้ interface เป็นมิตรขึ้น โดยไม่ลดความชัดของ grouping

### 14.8 Typography System

Typography เป็นโครงสร้างหลักของ Swiss layer และต้องรองรับไทย–อังกฤษอย่างมีคุณภาพ

| Role | แนวฟอนต์ | ขนาดโดยประมาณ | การใช้งาน |
| --- | --- | --- | --- |
| **Display** | Characterful grotesque / condensed grotesque | `clamp(48px, 9vw, 144px)` | Hero thesis, section statement |
| **Heading** | Neo-grotesque 600–700 | `clamp(28px, 5vw, 80px)` | Section heading, project title |
| **Body** | Thai/Latin sans ที่อ่านง่าย 400–500 | 16–20px | คำอธิบายและเนื้อหา |
| **Label** | Mono 500 | 11–12px | Control, technical label, node |
| **Metadata** | Mono 400 | 9–11px | ID, coordinate, timestamp, stack |

แนวทางฟอนต์:

- Display Latin: Neue Montreal / Söhne / Aeonik / Space Grotesk หรือ family ที่มีบุคลิกใกล้เคียง
- Thai: IBM Plex Sans Thai / Anuphan / LINE Seed Sans TH หรือ family ที่ optical balance เข้ากับ Latin
- Utility/Mono: JetBrains Mono / IBM Plex Mono / Cascadia Code
- ไม่ใช้ mono กับ body copy เพียงเพื่อให้ดู technical
- Thai ต้องมี line-height สูงกว่า Latin เล็กน้อยและตรวจการตัดบรรทัดจริง
- ใช้ weight, tracking, case และ contrast สร้าง role ก่อนเพิ่มขนาดย่อยจำนวนมาก
- Heading ต้อง wrap อย่างตั้งใจที่ 375, 768 และ 1440px
- ห้ามใช้ฟอนต์หลาย family จน visual system แตก

### 14.9 Motion Design & Animation System

Motion ต้อง **กระจายอยู่ทั่วประสบการณ์ แต่มี hierarchy** เพื่อให้เห็นความใส่ใจตั้งแต่ transition ใหญ่ถึงรายละเอียดระดับ micro

| ระดับ | ระยะเวลาแนะนำ | หน้าที่ |
| --- | --- | --- |
| **Macro / Spatial** | 600–1400ms | Camera move, section transition, exploded 3D assembly |
| **Meso / Component** | 280–700ms | Panel, filter, accordion, project preview, menu |
| **Micro / Feedback** | 120–280ms | Hover, focus, press, icon morph, underline, status |
| **Ambient** | 4–20s ต่อรอบ | Slow orbit, trace pulse, subtle material/light drift |

**Motion principles:**

- การเคลื่อนไหวต้องอธิบาย causality, hierarchy, state หรือ spatial relationship
- จังหวะหลักของหน้าให้มี orchestrated moment; micro-motion ใช้เสริม ไม่แข่งกับฉากหลัก
- element ที่เกี่ยวข้องเคลื่อนไหวเป็นกลุ่ม ไม่ stagger ทุกตัวอักษรหรือทุก card
- ใช้ easing ที่สอดคล้อง: precise/snappy สำหรับ control, damped/smooth สำหรับ 3D
- รักษา continuity เมื่อผู้ใช้เปิด panel, เปลี่ยน filter, เข้า project หรือย้อนกลับ
- ไม่ trigger animation ซ้ำทุกครั้งที่ scroll ผ่านจนรบกวน
- animation ต้องไม่หน่วง navigation หรือทำให้ action รอโดยไม่จำเป็น

**ตัวอย่าง micro-craft ที่ต้องออกแบบ:**

- Nav ปรับ opacity/specular edge ตามพื้นหลังขณะ scroll
- CTA มี press depth และ directional arrow response
- Link underline วิ่งตามทิศทาง pointer/focus
- Grid intersection หรือ signal trace ตอบสนองเมื่อ node active
- Project media ขยับ perspective/scale เล็กน้อยพร้อม caption reveal
- Filter แสดง selected state ด้วยตำแหน่งและรูปทรง ไม่พึ่งสีอย่างเดียว
- AI launcher แสดง listening/thinking/streaming state แยกกัน
- Form field มี focus, valid, invalid, loading และ success transition
- Loading ใช้ system assembly/progress ที่สัมพันธ์กับงาน ไม่ใช้ spinner generic หากไม่จำเป็น
- Cursor enhancement ใช้ได้เฉพาะ desktop fine pointer และห้ามแทน cursor มาตรฐานสำหรับ control สำคัญ

**Reduced motion:**

- รองรับ `prefers-reduced-motion: reduce` อย่างจริงจัง
- ปิด camera travel, parallax, continuous orbit และ large transforms
- คง state feedback ด้วย opacity, border หรือ instant transition
- ข้อมูลและลำดับการใช้งานต้องไม่หายเมื่อปิด motion

### 14.10 Component Composition Rules

**Navbar**

- Floating Liquid Glass layer เหนือ scene
- มีสถานะ top, scrolled, menu-open และ over-light-content
- Desktop/Tablet/Mobile ต้องมี navigation strategy ต่างกัน
- Focus ต้องไม่ถูก sticky region บัง

**Hero**

- Hero คือ visual thesis ไม่ใช่ heading กึ่งกลาง + ปุ่มสองปุ่ม
- 3D signature object เป็นฐาน spatial; headline และ CTA จัดด้วย Swiss grid
- Signature object ต้องมี direct manipulation อย่างน้อย rotate + hotspot + explode/assemble พร้อม reset control
- Value proposition และ primary CTA ต้องเห็นภายใน first viewport บนมือถือ
- ต้องมี fallback ที่ยังคง brand memory เมื่อ 3D ไม่โหลด

**Solution Selector**

- ใช้ typographic/structural grid แทน card ซ้ำ 6 ใบที่เหมือนกัน
- แสดงความต่างของโจทย์ด้วย density, span, label หรือ spatial relation
- มี hover, focus, selected และ touch state

**Project / Case Study**

- ใช้ภาพผลงานจริงหรือ system evidence เป็น visual lead
- Card แต่ละใบอาจมี crop/scale/span ต่างกันตามความสำคัญ
- แสดงชื่อ ปัญหา ผลลัพธ์ stack และสถานะ prototype/sample อย่างตรงไปตรงมา
- Hover/focus ต้องเปิดข้อมูลเพิ่มโดยไม่ซ่อน action หลักจาก keyboard/touch

**Services**

- สื่อระดับ complexity/scale จาก Landing → Platform/AI
- ใช้ list, axis, ladder หรือ spatial progression แทน uniform card grid
- ทำให้คนทั่วไปเห็นสิ่งที่จะได้รับ และคนเทคเห็นขอบเขตระบบ

**System Schematic / Process**

- ใช้ node, trace, layer และ label จาก architecture จริง
- เชื่อม process Discovery → Architecture → Build → Ship → Scale กับ data flow
- ห้ามใช้ dashboard mockup generic แทน architecture

**AI Widget / Chat**

- ใช้ Liquid Glass เพราะเป็น interface ที่ลอยเหนือ content
- มีสถานะ closed, greeting, open, thinking, streaming, error และ reconnect
- Overlay ปิดด้วย Escape, คืน focus และไม่บัง CTA สำคัญบนมือถือ
- ข้อความระบุชัดว่า AI อาจผิดพลาดและข้อมูลใดเป็นการประมาณ

**Forms / Interactive Preview**

- ออกแบบ default, focus, filled, valid, invalid, loading, disabled และ success
- Error ต้องบอกวิธีแก้โดยไม่ล้างข้อมูลที่กรอก
- Preview มี static fallback และ alternative navigation สำหรับ touch/keyboard

### 14.11 Tech Craft Language

Tech Craft คือการทำให้ความเชี่ยวชาญมองเห็นได้จาก **รายละเอียดที่มีความหมาย** ไม่ใช่การเติมคำว่า AI หรือ code ลงในทุกพื้นที่ และไม่จำเป็นต้องทำให้ทุกพื้นผิวดูดิบ เหลี่ยม หรือเหมือนแบบร่างทางวิศวกรรม

ภาพรวมควรเป็น **Refined Tech Craft**: โครงสร้างแม่นแบบงานวิศวกรรม แต่ผิวสัมผัส รูปทรง การเคลื่อนไหว และขอบมนสะอาดแบบผลิตภัณฑ์เทคโนโลยีสมัยใหม่ Blueprint, grain, annotation และเส้นประกอบต้องเป็นรายละเอียดรอง ไม่ใช่สิ่งที่ครองทุก viewport

ควรใช้:

- System trace, request path และ node state ที่อิง architecture จริง
- Version, build state, project type, stack และ metadata จริง
- Dimension line, calibration mark, coordinate และ material label เมื่อสัมพันธ์กับ scene
- Product UI, real screenshot, repository evidence, certificate และทีมจริง
- Loading/progress ที่สื่อว่าระบบกำลังทำอะไร
- Optical correction ใน alignment, baseline, icon และ typography
- Consistent naming, timing, border, radius และ spacing token

ห้ามใช้:

- Fake terminal, fake code, fake latency, fake live status หรือ metric ที่ไม่มีข้อมูลรองรับ
- Random hex value, coordinate หรือ node เพื่อเติมพื้นที่
- Technical label บน section ที่ไม่เกี่ยวกับระบบ
- Icon ในกล่อง gradient ที่ไม่มีความหมาย
- งาน 3D สำเร็จรูปที่ไม่เชื่อมกับ product หรือ brand
- Claim เรื่อง security, performance หรือ scale โดยไม่มีหลักฐาน/คำอธิบาย

### 14.12 Imagery, Evidence & Human Presence

- ใช้ภาพผลงานจริงใน frame ที่ออกแบบเองและให้พื้นที่มากพอเป็น visual evidence
- ใช้ภาพทีมจริง เบื้องหลังการทำงาน และใบรับรองจริง
- ไม่ merge ความสามารถหรือใบรับรองของสมาชิกหลายคนเป็นคนเดียว
- ถ้าใช้ sample/prototype/estimated outcome ต้องติด label ชัดเจน
- ใช้ 3D render เพื่ออธิบาย product/system ไม่ใช้แทนหลักฐานจริงทั้งหมด
- กำหนด crop, aspect ratio, caption, lazy-loading, empty และ error state ของ media
- Alt text ต้องอธิบายข้อมูลที่ภาพสื่อ; decorative image ใช้ alt ว่างหรือ aria-hidden
- หลีกเลี่ยง stock photo และภาพ AI ที่ทำให้แบรนด์ดูไม่จริง

### 14.13 Responsive Transformation

Mobile ต้อง **recompose** ไม่ใช่ย่อ desktop:

**Desktop 1280–1600px**

- ใช้ 12-column grid และ spatial depth เต็ม
- 3D interaction ใช้ pointer และ scroll ได้
- Visible grid แสดง major/minor track ได้เต็ม
- ใช้ asymmetry และพื้นที่ว่างเพื่อกำหนด narrative pace

**Tablet ~768–1024px**

- ลด depth layer และจำนวน floating control
- เปลี่ยน 12-column เป็น 6–8-column
- ลดความซับซ้อนของ 3D shader/texture และ motion
- Navigation และ filter ต้องรองรับ touch ชัดเจน

**Mobile 320–767px**

- จัดลำดับ Hero: positioning → value proposition → CTA → immersive visual
- 3D เปลี่ยนเป็น crop/close-up หรือ static poster ไม่บังคับรักษามุม desktop
- ลด grid density เหลือ major track ที่ช่วย alignment
- Glass panel ต้องไม่กินพื้นที่จนบัง primary content
- Horizontal carousel ต้องมีทางเลือก tap/button ไม่บังคับ drag
- Target size ของ control อย่างน้อยประมาณ 44×44px
- ปิด parallax/cursor effect และ ambient detail ที่ไม่คุ้ม performance
- ตรวจข้อความไทยยาว, ภาษาอังกฤษ, zoom และ orientation change

### 14.14 Accessibility & Performance Requirements

**Accessibility:**

- Contrast ของ text/control ผ่าน WCAG AA ในทุก material รวม glass และ scene
- Semantic heading และ landmark ถูกต้อง
- ทุก interaction ใช้งานได้ด้วย keyboard และ touch
- Focus visible ชัดและไม่ใช้สีอย่างเดียว
- Overlay ปิดด้วย Escape, trap focus เมื่อ modal และคืน focus เมื่อปิด
- 3D interaction ที่มีข้อมูลต้องมี text/list/diagram alternative
- Motion ไม่มี flash และไม่ก่อให้เกิด vestibular discomfort
- รองรับ reduced motion, forced colors และ high-contrast mode เท่าที่ component เกี่ยวข้อง
- ห้ามอ้างว่า accessible/compliant จาก automated test เพียงอย่างเดียว

**Performance:**

- Critical copy และ CTA render ก่อน 3D asset
- LCP < 2.5s, CLS < 0.1, INP < 200ms ตามเป้าหมายใน §8.2
- Lazy-load scene/project media ที่อยู่นอก first viewport
- ใช้ Draco/Meshopt, KTX2/WebP/AVIF หรือเทคนิคบีบอัดที่เหมาะกับ asset
- ลด draw call, texture resolution, post-processing และ transparent layer บน mobile
- ห้ามสร้าง WebGL context หลายตัวโดยไม่จำเป็น
- Pause ambient animation เมื่อ tab hidden หรือ scene อยู่นอก viewport
- มี device-quality tier หรือ fallback สำหรับ low-power device
- Glass blur และ `will-change` ใช้เฉพาะ component ที่จำเป็น
- Reserve geometry ของ media/3D canvas เพื่อป้องกัน layout shift
- ตรวจ memory, CPU/GPU usage และ battery impact บนมือถือจริง

### 14.15 Interaction State Inventory

ทุก interactive component ต้องออกแบบ state ที่เกี่ยวข้อง ไม่ส่งเฉพาะภาพ default:

- Default
- Hover
- Keyboard focus
- Active/pressed
- Selected/current
- Disabled
- Loading/progress
- Empty
- Error/recovery
- Success/confirmation
- Offline/reconnect (chat/realtime)
- Destructive/confirmation (CMS)
- Reduced-motion
- Glass fallback / WebGL fallback
- 3D idle / hint / dragging / selected / exploded / reset
- Long content / translated content

State ต้องสื่อด้วย shape, position, label หรือ icon ร่วมกับสี และ transition ต้องไม่ทำให้ layout กระโดด

### 14.16 Anti-“AI Slop” Contract

ห้าม:

- Gradient blob/orb ที่ไม่มีหน้าที่
- Glass card ซ้ำเต็มหน้า
- Hero กึ่งกลางแบบ heading + subtitle + CTA คู่โดยไม่มี spatial thesis
- Card 3 ใบหรือ 6 ใบที่เหมือนกันทุกอย่าง
- Dashboard mockup generic
- Glow รอบทุก object
- ใช้ border radius ค่าเดียวและรูปทรง rounded card แบบเดียวกับทุก component จน hierarchy หาย
- Technical label, code และ metric ปลอม
- Animation กับทุก element หรือ stagger รัว ๆ
- 3D asset ที่ไม่เกี่ยวกับ product
- ใช้ grid เป็น wallpaper ทุก section
- Marketing copy กว้างและตรวจสอบไม่ได้
- ทุก section ใช้ composition เดียวกัน
- ซ่อนข้อมูลสำคัญไว้หลัง hover เท่านั้น
- รักษา desktop layout บน mobile ด้วยการย่อทุกอย่าง

ต้องมี:

- Thesis เดียวและ hierarchy ของ layer ที่ชัด
- Product evidence และ copy เฉพาะของ T4 Labs
- One focal point ต่อ viewport/section
- Section composition ที่หลากหลายภายใต้ grid เดียวกัน
- Shape/radius system ที่ทำให้ component ดู modern และ futuristic โดยยังแยก hierarchy ได้
- Responsive recomposition
- State และ fallback ครบ
- Micro-craft ที่สม่ำเสมอ
- Performance และ accessibility เป็นส่วนของ art direction

### 14.17 Signature Elements

ใช้ motif ต่อไปนี้ซ้ำอย่างมีวินัยเพื่อสร้าง brand memory:

1. **Product Reactor** — 3D signature object ที่แสดงการประกอบ product/system
2. **Exploded Stack** — Layer `CLIENT → EDGE → API → DATA → AI` ในรูป 3D/2D schematic
3. **Signal Trace** — เส้น accent ที่เดินทางระหว่าง node/section เพื่อสื่อ data/request flow
4. **Blueprint Field** — Visible grid ที่เปลี่ยนระดับ visible/quiet/invisible ตามเนื้อหา
5. **Glass Control Surface** — floating nav/control/AI interface ที่มี material behavior สม่ำเสมอ
6. **Micro Status Language** — focus, loading, connection, selected และ transition ที่ละเอียด
7. **Section Coordinate** — index/label ที่อ้างอิงลำดับจริงของเนื้อหา ไม่ใช้ตัวเลขตกแต่ง
8. **Material Contrast** — machined dark surface × warm ink × signal accent

ไม่จำเป็นต้องใช้ motif ทุกข้อในทุกหน้า เลือกเฉพาะที่ช่วยหน้าที่ของหน้านั้น

### 14.18 Signature Visual — Immersive System Schematic

Visual หลักของแบรนด์ต้องสื่อความสามารถในการคิดและสร้างระบบ:

- ใช้ exploded 3D stack หรือ spatial node map ของ request จริง
- โครงหลัก: `Client (Next.js) → Edge (Cloudflare) → API (Nest.js) → Data (Supabase · pgvector) → AI (LLM · RAG)`
- เมื่อผู้ใช้ focus/hover node ให้ข้อมูลที่เกี่ยวข้องและ trace ชัดขึ้น
- เชื่อมกับ process `Discovery → Architecture → Build → Ship → Scale`
- ใช้ Swiss typography และ Blueprint grid เป็นระบบอธิบาย
- ใช้ Liquid Glass เป็น control/tooltip เหนือ schematic
- มี 2D/static fallback ที่สื่อข้อมูลเท่ากัน
- ห้ามใช้ stock image, generic dashboard หรือ decorative network ที่ไม่มี data relationship จริง

### 14.19 Design Deliverables & Acceptance

**Deliverables ที่ต้องมี:**

- Design token: color, type, spacing, grid, border, **radius/shape**, material, depth, light และ motion
- Figma component พร้อม state inventory
- Desktop 1440px, Tablet 768px และ Mobile 375px อย่างน้อย
- 3D scene storyboard และ asset/fallback specification
- Interactive 3D prototype ที่ทดสอบ rotate, hotspot, explode/assemble, reset และ touch/keyboard alternative
- Motion prototype ของ macro, component และ micro interaction สำคัญ
- Blueprint/grid visibility map ราย section
- Glass usage map ระบุ component และ fallback
- Accessibility annotation และ keyboard order
- Performance budget/quality tier ของ 3D และ media
- Content label สำหรับ real/sample/prototype/estimated evidence

**เกณฑ์รับงานดีไซน์:**

- [ ] มองเห็น hierarchy ว่า 3D เป็น Layer 1 และ Swiss เป็น Layer 2 อย่างชัดเจน
- [ ] 3D ช่วยอธิบาย product/system ไม่ใช่ของตกแต่ง
- [ ] มี Signature 3D Model อย่างน้อยหนึ่งจุดที่ผู้ใช้เล่นได้จริง: rotate, hotspot, explode/assemble และ reset
- [ ] การควบคุม 3D ใช้ได้ทั้ง pointer, touch และมี keyboard/2D alternative สำหรับข้อมูลสำคัญ
- [ ] 3D interaction ไม่ hijack scroll, ไม่บัง CTA และคืนสถานะเริ่มต้นได้เสมอ
- [ ] Content และ CTA อ่าน/ใช้ได้แม้ปิด 3D และ motion
- [ ] Liquid Glass ใช้เฉพาะ spatial interface ที่เหมาะสม
- [ ] ขอบมนถูกใช้เป็นระบบและช่วยให้ภาพรวมดู modern/futuristic โดยไม่ทำให้ทุก section กลายเป็น rounded card ซ้ำกัน
- [ ] ภาพรวมเป็น Refined Tech Craft ไม่ดิบหรือเต็มไปด้วย Blueprint/annotation จนเกินไป
- [ ] Visible Grid มีระดับ visible/quiet/invisible ตามหน้าที่
- [ ] แต่ละ section มี focal point เดียวและ composition ไม่ซ้ำแบบ template
- [ ] Motion ครบทั้ง macro/meso/micro แต่ไม่รบกวน
- [ ] มี reduced-motion และ WebGL/glass fallback
- [ ] Mobile ถูก recompose ไม่ใช่ย่อ desktop
- [ ] ทุก interactive component มี state ที่จำเป็น
- [ ] ใช้หลักฐานจริงและระบุ sample/prototype อย่างตรงไปตรงมา
- [ ] Contrast, focus, heading และ keyboard flow ผ่านการตรวจ
- [ ] ไม่มี horizontal overflow หรือข้อความล้นที่ 375/768/1440px
- [ ] ไม่มี console error และ scene ไม่ทำให้ Core Web Vitals หลุดเป้าหมาย
- [ ] ทั้งเว็บรู้สึกเป็นระบบเดียวกันและจดจำได้ว่าเป็น T4 Labs


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

*หมายเหตุ: เอกสารนี้คงโครงสร้างและข้อกำหนดเชิงผลิตภัณฑ์จาก Requirement.MD แต่กำหนด Art Direction ใหม่เป็น Editorial Minimalism × Modern Swiss × Liquid Glass × Visible Grid × 3D and Immersive Elements × Motion Design and Animation × Tech Craft โดยมี 3D เป็นฐานชั้นแรกและ Swiss เป็นฐานชั้นที่ 2*

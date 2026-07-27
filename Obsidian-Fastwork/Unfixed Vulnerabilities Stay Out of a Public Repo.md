---
tags:
  - engineering
  - security
  - documentation
description: In a public repository, an unfixed vulnerability's surface and exploit path belong in a gitignored note and a non-specific issue title — not in the tracker or a docs report.
source: T4 Fastwork — 2026-07-27 codebase scrutiny (docs/reports/2026-07-27-codebase-scrutiny.md)
---

# Unfixed Vulnerabilities Stay Out of a Public Repo

รีโปนี้เป็น **public** ฉะนั้นการเขียนรายละเอียดช่องโหว่ที่ *ยังไม่ปิด* ลงใน issue · PR · ledger หรือรายงานใน
`docs/` เท่ากับเผยแพร่แผนที่ให้ผู้โจมตีก่อนที่ patch จะขึ้น · ระเบียบวินัยตามปกติของงานวิศวกรรม — บันทึกทุกอย่าง
ให้ครบเพื่อเซสชันหน้า — จึงชนกับความปลอดภัยตรงจุดนี้ และวิธีแก้คือ**แยกที่เก็บ ไม่ใช่บันทึกน้อยลง**

## รูปแบบที่ใช้

- **รายละเอียดเต็ม** (ชื่อ object · policy จริง · เส้นทาง exploit · SQL ที่จะแก้) → ไฟล์ใน
  `docs/security-private/` ซึ่ง `.gitignore` กันไว้ · อยู่บนดิสก์เดียวกันกับรีโปเพื่อให้เซสชันหน้าหาเจอ
  แต่ไม่ถูก publish
- **รายงานสาธารณะ** → ระบุว่ามี N ข้อที่ถูกกันไว้ · บอก *path* ของไฟล์ private · **ไม่บอกชื่อพื้นผิว**
  เพราะแค่ชื่อตารางหรือชื่อ bucket ก็ลดต้นทุนการโจมตีลงมากแล้ว
- **GitHub issue** → หัวข้อกลาง ๆ ที่ทำงานได้จริง (เช่น `fix(security): tighten a production authorization
  policy` — สังเกตว่าตัวอย่างนี้ตั้งใจไม่บอกชื่อพื้นผิว แม้ในโน้ตที่อธิบายกฎ) แล้วชี้ไปที่ไฟล์ private · ยังคงมี issue ต่อ deliverable ตามกฎ ไม่ได้ข้ามขั้น
- **เมื่อปิดแล้ว** ย้ายสรุปแบบตัดทอนขึ้นรายงานสาธารณะ และลบเส้นทาง exploit ออกจากไฟล์ private

## เส้นที่ใช้ตัดสินว่าอะไรกันไว้

กันไว้เมื่อการรู้ *ตำแหน่ง* ทำให้โจมตีได้ง่ายขึ้นจริง — ช่องโหว่ authz ที่ยังเปิด · sink ของ XSS ที่ยังไม่ escape ·
guard ที่ fail-open · endpoint ที่ไม่ยืนยันตัวตนแล้วคืนข้อมูลภายใน · ไม่ต้องกันบั๊กเชิงความถูกต้องทั่วไป
(ค่าเพี้ยน · cache ไม่ bust · event หาย) แม้จะน่าอาย เพราะมันไม่ได้ให้อำนาจใครเพิ่ม

## กับดักที่เจอตอนทำ

ตัวเลขและ policy ต้อง**อ่านจากของจริง** ไม่ใช่จากที่ agent รายงาน · สองข้อที่หนักสุดในรอบ 2026-07-27 ถูกยืนยัน
ด้วย query `pg_policy` แบบอ่านอย่างเดียวและการ probe PostgREST ด้วย anon key — และการยืนยันนั้นเองที่ทำให้พบว่า
ข้อหนึ่ง**ยังไม่ live** (ไม่มีแถวที่เข้าเงื่อนไข) ซึ่งเปลี่ยนลำดับความสำคัญ · การกันข้อมูลไว้ไม่ได้แปลว่าไม่ต้องพิสูจน์

Related: [[Authoritative Validation at Trust Boundaries]] · [[Authorization Needs a Backstop]] ·
[[Documentation Truth Hierarchy]] · [[Evidence Before Completion]] · [[Living Documentation and Handoffs]]

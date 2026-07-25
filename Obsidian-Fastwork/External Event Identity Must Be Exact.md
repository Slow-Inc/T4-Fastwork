---
tags: [integration, boundaries, webhooks, testing]
description: Match provider events to internal records by the exact identifier the provider states, never by a derived or formatted field.
source: T4 Fastwork #204 — Vercel deployment.succeeded → showcase project mapping
---

# External Event Identity Must Be Exact

เมื่อรับ event จากระบบภายนอกแล้วต้อง map กลับมาหา record ของเรา ให้ใช้ identifier ที่ provider ระบุมาตรง ๆ ไม่ใช่ค่าที่เราอนุมานจากรูปแบบของฟิลด์อื่น

- ฟิลด์ที่ "ดูเหมือน" ตัวระบุมักไม่ใช่ — Vercel `deployment.url` คือ host ประจำตัวของ deployment นั้น (`<project>-<hash>.vercel.app`) ไม่เคยเป็น production alias หรือ custom domain ดังนั้นการเทียบมันกับ `live_url` ของเราไม่มีทางตรงบน production เลย ตัวระบุจริงคือ `deployment.meta.githubCommit{Org,Repo}`
- resolve ด้วย identifier ที่แน่นอนเป็นหลัก เก็บการเทียบแบบอนุมานไว้เป็น fallback เท่านั้น
- **ยังต้องตรวจกับข้อมูลของเราเสมอ** — ชื่อ repo ที่ provider ส่งมาไม่ใช่สิทธิ์ให้เข้า pipeline; ต้องยืนยันว่าเป็น record ที่เราดูแลจริง
- event ที่ resolve ไม่ได้ต้อง log ระดับ warn พร้อมค่าที่เทียบไม่ตรง — ไม่งั้นมันจะดูเหมือน no-op ปกติ และเราจะไม่รู้เลยว่ามันไม่เคย match อะไรได้ ([[Degraded Modes Must Be Observable]])
- **เทสต์ที่ประกอบ payload ขึ้นมาให้ตรงกับ implementation ไม่ได้พิสูจน์อะไร** — เคสเดียวที่ "ยืนยัน" ว่า mapper ทำงานใช้ `deployment.url = 'demo.example'` ที่ตั้งไว้ให้เท่ากับ `live_url` ของ fixture พอดี ให้ใช้ payload รูปทรงเดียวกับของจริงเสมอ ([[Stable E2E Assertions]])

Related: [[Anti-Corruption Layers at External Boundaries]] · [[Idempotent Event Processing]] · [[Cross-Service Contract Compatibility]]

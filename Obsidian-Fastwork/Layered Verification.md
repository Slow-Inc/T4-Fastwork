---
tags:
  - engineering
  - testing
description: Verify each completed slice at the unit, integration, and real-user layers required by its risk.
source: Adapted from MangaDock feedback-test-every-round
---

# Layered Verification

งานหนึ่ง slice ยังไม่เสร็จจนกว่าจะตรวจสอบครบทุกชั้นที่สามารถเห็น failure mode ของมันได้ การเลือก test ให้พิจารณาจาก risk และเส้นทางจริง ไม่ใช่จาก package ที่แก้เพียงอย่างเดียว

สำหรับ T4 Fastwork:

- Frontend logic/component: `bun test` ใน `nextjs/`
- Frontend layout, hydration, navigation หรือ interaction: `bun run e2e` ใน `nextjs/` เป็นข้อบังคับ
- Backend logic/API: `bun test` ใน `nestjs/` และเพิ่ม e2e เมื่อ contract หรือ wiring เปลี่ยน
- Build/type boundary: รัน build ของ package ที่เกี่ยวข้องเมื่อการเปลี่ยนแปลงอาจกระทบ compilation หรือ runtime bundling
- Auth, RLS, admin write และ security-sensitive flow: ตรวจทั้ง positive/negative authorization path และทำ security review ตามกฎ repository

บันทึก command, ผลลัพธ์ และข้อจำกัดของการตรวจไว้ใน issue/report ที่เกี่ยวข้อง เพื่อให้ผู้อื่นทำซ้ำได้

Related: [[Evidence Before Completion]] · [[Safe Core Refactoring]] · [[Change Impact Records]]

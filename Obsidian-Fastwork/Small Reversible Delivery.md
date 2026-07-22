---
tags:
  - engineering
  - delivery
description: Make one scoped change at a time, verify it, and preserve a clear rollback path before proceeding.
source: Adapted from MangaDock surgical-change and incremental-refactoring practices
---

# Small Reversible Delivery

เปลี่ยนระบบทีละก้อนที่มี objective เดียว ตรวจสอบได้ และย้อนกลับได้ชัดเจน จากนั้นจึงเดินไปก้อนถัดไป

ก้อนงานที่ดีมีคุณสมบัติ:

- scope และ non-goals ชัด
- behavior change แยกจาก code movement หรือ dependency upgrade
- มี test/evidence ที่พิสูจน์ก้อนนั้นโดยตรง
- ไม่รวม cleanup ข้างเคียงที่ไม่จำเป็น
- มี rollback path ที่ไม่ต้องรื้อการเปลี่ยนแปลงอื่น
- ถ้ามี migration หรือ flag ให้ระบุ compatibility window และ exit condition

ก่อนแตะ shared core, schema, auth หรือ deployment ให้ resolve target ด้วย read-only checks และบันทึก state เดิม เมื่อการเปลี่ยนแปลงมีความเสี่ยงสูง ให้ใช้ seam, feature flag, additive migration หรือ staged rollout ตามความเหมาะสม

Related: [[Engineering North Star]] · [[Safe Core Refactoring]] · [[Change Impact Records]]

---
tags:
  - engineering
  - documentation
description: Keep canonical documentation and resume context aligned with the actual system after each meaningful increment.
source: Adapted from MangaDock feedback-md-update-every-change and feedback-md-history-log
---

# Living Documentation and Handoffs

เอกสาร canonical ต้องสะท้อน state จริงของระบบ ไม่ใช่ภาพในวันที่เริ่มออกแบบ หลัง increment ที่เปลี่ยน behavior, contract, architecture หรือ workflow ให้ปรับเอกสารที่เป็นเจ้าของความจริงนั้นทันที

handoff ที่ดีควรตอบได้ว่า:

- ทำอะไรเสร็จแล้วและมีหลักฐานใด
- เหลืออะไร รวมถึง known gaps และความเสี่ยง
- มีไฟล์หรือการเปลี่ยนแปลงใดที่ยังไม่ commit
- decision ใดถูกตัดสินแล้วและอยู่ใน ADR/issue ใด
- เริ่มต่อที่ไหนและ command ใดใช้ตรวจสอบ

ใช้ `docs/OPEN-WORK-LEDGER.md` และ issue เป็นสถานะงาน, ADR เป็นเหตุผลของ decision, spec/design เป็น current design และ report เป็นหลักฐาน/ผลกระทบ อย่าสร้างแหล่ง truth ซ้ำโดยไม่มีเจ้าของชัดเจน

Related: [[Experiment and Decision Records]] · [[Change Impact Records]] · [[Command Documentation Synchronization]]

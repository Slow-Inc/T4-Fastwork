---
tags: [data, deployment, reliability]
description: Make migrations safe to verify, rerun, observe, and reconcile with tracked history.
source: Adapted from MangaDock migration plans and operational ledgers
---

# Idempotent Data Migrations

migration ควรตรวจ precondition, ทำงานซ้ำได้อย่างปลอดภัยเมื่อเหมาะสม และทิ้งหลักฐานว่า schema จริงตรงกับ tracked history

- แยก preflight, apply และ verify
- ใช้ guards/constraints ที่ทำให้ rerun เป็น no-op หรือ fail ชัดเจน
- ห้ามถือว่าไฟล์ migration เท่ากับถูก apply แล้ว
- ตรวจ schema/data invariant หลัง apply ผ่านเส้นทางจริง
- วาง rollback หรือ forward-fix ก่อนแตะ production

Related: [[Release Truth and Rollback Drills]] · [[Atomic State Transitions and TOCTOU]]

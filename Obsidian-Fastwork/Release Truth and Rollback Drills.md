---
tags: [delivery, operations, deployment]
description: A release is complete only when the deployed state is identifiable, verified, and recoverable.
source: Adapted from MangaDock deployment reports and reconciliation plans
---

# Release Truth and Rollback Drills

สถานะ release ต้องตอบได้ว่า commit/config/migration ใดกำลังทำงานจริง และ rollback ได้อย่างไร การ build ผ่านไม่เท่ากับ production converged

- pin artifact และ dependency/toolchain ที่ใช้สร้าง
- CI ต้องใช้ package manager และคำสั่งเดียวกับ repository
- verify deployment ผ่าน real endpoint/readiness และ critical flow
- บันทึก config/schema drift ที่ apply นอก tracked path
- ฝึก rollback/restore และระบุจุดที่ย้อนกลับไม่ได้

Related: [[Idempotent Data Migrations]] · [[Evidence Before Completion]]

---
tags: [architecture, rollout, safety]
description: New behavior should default to identity or no-op until explicitly enabled and verified.
source: Adapted from MangaDock ADR 002 and feature-flag rollout records
---

# Identity Defaults and Safe Rollouts

feature ใหม่ที่เปลี่ยน output หรือ cost ควรเริ่มจาก default-off หรือ identity behavior เพื่อให้ deploy กลไกแยกจากการเปิด policy

- เมื่อปิด flag ผลลัพธ์ต้องเทียบเท่าพฤติกรรมเดิม
- config ต้องมี owner, allowed values และ startup visibility
- เปิดเป็น cohort หรือ environment เล็กก่อน พร้อม metric และ rollback trigger
- ลบ flag เมื่อ rollout จบเพื่อไม่ให้ mode matrix โตถาวร
- feature ที่ fail-open/fail-closed ต้องเลือกตามความเสี่ยงอย่างตั้งใจ

Related: [[Small Reversible Delivery]] · [[Degraded Modes Must Be Observable]]

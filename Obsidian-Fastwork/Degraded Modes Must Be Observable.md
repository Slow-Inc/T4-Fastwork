---
tags: [reliability, observability, operations]
description: Best-effort and fallback behavior must expose when and why service quality changed.
source: Adapted from MangaDock lazy-loading, cache, and readiness ADRs
---

# Degraded Modes Must Be Observable

fallback ที่ทำให้ระบบยังตอบได้อาจซ่อนความเสียหาย หากผู้ดูแลมองไม่เห็นว่าระบบเปลี่ยน mode เมื่อใด

- ระบุ degraded mode และ trigger อย่างชัดเจน
- log/metric ต้องแยก normal, fallback, cache hit/miss และ dropped work
- response หรือ operator surface ควรบอกข้อจำกัดเมื่อมีผลต่อผู้ใช้
- alert จากผลกระทบและระยะเวลาที่ degrade ไม่ใช่จาก heartbeat อย่างเดียว
- ทดสอบ recovery กลับสู่ normal mode และป้องกัน fallback ค้าง

Related: [[Liveness Readiness and Startup Gates]] · [[SLOs Runbooks and Recovery Drills]]

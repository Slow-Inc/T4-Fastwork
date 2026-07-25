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
- **write ที่ไม่เช็ค `error` คือ degraded mode ที่มองไม่เห็น** — log ความสำเร็จต้องผูกกับผลของการเขียน ไม่ใช่ผลของงานก่อนหน้า (T4 #205: capture สำเร็จ รูปอยู่ใน Storage แต่ทั้ง statement ถูกปฏิเสธเพราะคอลัมน์ใหม่ยังไม่มี → row ไม่ได้รูป แต่ log บอกว่าสำเร็จ)
- โค้ดที่เทสต์เข้าไม่ถึงคือที่ซ่อนของ degraded mode เหล่านี้ — สคริปต์ที่รัน `main()` ตอน import ทำให้ unit-test ไม่ได้เลย ให้แยกการเขียนออกเป็น seam ที่ inject dependency ได้ ([[Feature Boundaries and Stable Seams]])

Related: [[Liveness Readiness and Startup Gates]] · [[SLOs Runbooks and Recovery Drills]] · [[External Event Identity Must Be Exact]]

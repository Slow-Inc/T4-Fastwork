---
tags: [reliability, resources, lifecycle]
description: Release acquired resources on every exit path and make cleanup safe to repeat.
source: Adapted from MangaDock process lifecycle ADRs and defect reports
---

# Async Cleanup and Idempotent Shutdown

resource ที่ acquire แล้วต้องถูก release ใน `finally` หรือ lifecycle boundary ที่เทียบเท่า ไม่ว่าจะสำเร็จ ยกเลิก timeout หรือ throw

- cleanup ต้อง idempotent เพื่อรองรับ shutdown หลายสัญญาณ
- clear timers, close streams, release locks/semaphores และ stop background work
- fail startup loudly เมื่อ preflight ไม่ผ่าน อย่าปล่อย half-ready process
- `atexit`/shutdown hook เป็น backstop ไม่ใช่เส้นทางหลัก
- ทดสอบ cancellation และ failure หลัง acquire ทุกจุดสำคัญ

Related: [[End-to-End Cancellation]] · [[Liveness Readiness and Startup Gates]]

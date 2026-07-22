---
tags: [reliability, operations, deployment]
description: Separate process liveness from ability to serve real work safely.
source: Adapted from MangaDock worker contracts and deployment readiness documents
---

# Liveness Readiness and Startup Gates

`alive` ไม่ได้แปลว่า `ready` กระบวนการอาจตอบ health check ได้แต่ dependency, model, migration หรือ worker pool ยังไม่พร้อม

- liveness ตอบว่ากระบวนการยังทำงานและควรถูก restart หรือไม่
- readiness ตอบว่ารับ traffic จริงได้อย่างปลอดภัยหรือไม่
- dispatcher/load balancer ต้องไม่ส่งงานก่อน readiness ผ่าน
- readiness ควรสะท้อน dependency ที่จำเป็นจริงและมีเหตุผลเมื่อไม่พร้อม
- runbook ต้องทดสอบทั้ง cold start, degraded dependency และ recovery

Related: [[Degraded Modes Must Be Observable]] · [[Release Truth and Rollback Drills]]

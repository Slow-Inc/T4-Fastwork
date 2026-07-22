---
tags: [architecture, performance, reliability]
description: Limit work at the scarce resource instead of serializing the entire pipeline.
source: Adapted from MangaDock ADR 005 and worker resource contracts
---

# Resource-Specific Concurrency Gates

อย่าใช้ semaphore เดียวครอบทั้ง pipeline เมื่อมีเพียงบาง stage ที่แย่ง resource ขาดแคลน ให้ gate ที่ CPU, GPU, database connection หรือ external quota ตาม owner จริง

- ระบุ resource budget รวมเมื่อหลาย workload อยู่ร่วมเครื่องเดียวกัน
- non-blocking stage ควรเดินต่อได้ถ้าไม่แตะ resource เดียวกัน
- queue depth, wait time และ saturation ต้องสังเกตได้
- cancellation ต้องคืน permit เสมอ
- ทดสอบ fairness, starvation และ overload behavior

Related: [[Async Cleanup and Idempotent Shutdown]] · [[Measure Performance at the Mechanism]]

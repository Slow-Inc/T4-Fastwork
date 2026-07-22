---
tags: [architecture, state, isolation]
description: Give mutable state an explicit owner, scope, lifetime, and reset boundary.
source: Adapted from MangaDock ADR 006 and cross-job state incident analysis
---

# Explicit State Lifetimes

mutable state ทุกก้อนต้องตอบได้ว่าใครเป็นเจ้าของ อยู่ได้นานเท่าไร และถูกล้างเมื่อใด โดยเฉพาะ singleton, cache และ context ที่ใช้ข้าม request

- แยก request/job/tenant state ออกจาก process-wide state
- ห้ามให้ข้อมูลจาก identity หรือ job ก่อนหน้ารั่วสู่ครั้งถัดไป
- จำกัด context window และ memory growth อย่างชัดเจน
- ถ้าต้อง share state ให้กำหนด concurrency, eviction และ invalidation contract
- ทดสอบ sequence ที่สลับ tenant, retry และ reuse worker

Related: [[Identity Transition Cache Isolation]] · [[Externalize State from Ephemeral Compute]]

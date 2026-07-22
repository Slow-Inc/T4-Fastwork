---
tags: [reliability, operations, queues]
description: Retry only transient failures with bounded attempts, then preserve failed work for inspection.
source: Adapted from MangaDock component runbooks and cache recovery reports
---

# Retry Taxonomy and Dead Letters

Retry เป็น policy ตามชนิดความล้มเหลว ไม่ใช่คำตอบอัตโนมัติสำหรับทุก error

- retry เฉพาะ transient failure เช่น timeout, connection failure, 429 และ 5xx ที่กำหนดไว้
- ไม่ retry deterministic 4xx, validation error หรือ invariant violation โดยไม่เปลี่ยน input
- จำกัดจำนวนครั้ง ใช้ exponential backoff/jitter และกำหนด timeout ต่อ attempt
- เมื่อหมด retry ให้ส่งเข้า dead-letter พร้อม context ที่ replay ได้และไม่เปิดเผย secret
- replay ต้อง idempotent, มี audit และควบคุม scope ได้

Related: [[Idempotent Event Processing]] · [[Deliberate Diagnosis Loop]]

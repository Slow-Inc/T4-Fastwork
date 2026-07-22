---
tags: [architecture, reliability, events]
description: Make duplicate delivery harmless with durable identity and atomic effects.
source: Adapted from MangaDock webhook and payment correctness documents
---

# Idempotent Event Processing

Webhook, queue message และ callback ต้องถือว่าอาจถูกส่งซ้ำ สลับลำดับ หรือมาถึงหลัง timeout ได้เสมอ ความปลอดภัยจึงต้องอยู่ที่ durable event identity ไม่ใช่ in-memory flag

- ตรวจ signature ก่อนทำ side effect
- ใช้ provider event ID หรือ business idempotency key ที่มี unique constraint
- บันทึกการรับ event และผลลัพธ์ที่เกี่ยวข้องใน atomic boundary เดียวกัน
- duplicate ต้องคืนผลที่สอดคล้องโดยไม่ทำ side effect ซ้ำ
- เก็บ audit trail สำหรับเหตุการณ์ที่ reject, retry และ replay

Related: [[Atomic State Transitions and TOCTOU]] · [[Retry Taxonomy and Dead Letters]]

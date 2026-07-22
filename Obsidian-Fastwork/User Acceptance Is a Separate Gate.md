---
tags: [quality, product, verification]
description: Passing automated tests does not replace evidence that users can complete the intended job.
source: Adapted from MangaDock academic UAT, UX critiques, and verification reports
---

# User Acceptance Is a Separate Gate

unit/integration tests พิสูจน์ contract ทางเทคนิค แต่ UAT พิสูจน์ว่าผู้ใช้ทำงานเป้าหมายได้และเข้าใจผลลัพธ์

- เขียน acceptance scenario จาก user job และ failure recovery
- ครอบคลุม loading, empty, error, offline และ permission states
- ตรวจ accessibility, responsive layout และ reduced motion เมื่อเกี่ยวข้อง
- เก็บ artifact/feedback และผูก defect กลับสู่ scenario
- อย่าให้ UAT แทน automated regression หรือกลับกัน

Related: [[Layered Verification]] · [[Evidence Before Completion]]

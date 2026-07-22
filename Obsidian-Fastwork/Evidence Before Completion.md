---
tags:
  - engineering
  - verification
description: Do not claim a defect fixed until evidence reproduces the original symptom and proves it is gone in the real path.
source: Adapted from MangaDock feedback-verify-before-claiming and feedback-benchmark-confirms-md-defect-fixed
---

# Evidence Before Completion

ห้ามสรุปว่า “แก้แล้ว” จาก test เขียวหรือเหตุผลเชิงโค้ดเพียงอย่างเดียว หลักฐานต้องผูกกลับไปยังอาการหรือ acceptance criterion เดิม และผ่านเส้นทางใช้งานจริงที่เกี่ยวข้อง

เกณฑ์ขั้นต่ำ:

- Before: reproduce อาการเดิมหรือระบุ baseline ที่ตรวจสอบย้อนกลับได้
- After: แสดงว่าอาการนั้นหายหรือ acceptance criterion ผ่าน
- Regression: รัน test ในระดับที่เหมาะกับความเสี่ยง
- Real path: ตรวจสอบผ่าน browser, API, database policy, streaming flow หรือ production-like path ตามชนิดงาน
- Two-sided metrics: วัด failure ได้ทั้งสองทิศเมื่อเกี่ยวข้อง เช่น ช้าเกิน/เร็วผิดปกติ, ล้น/หาย, false positive/false negative
- Subjective output: งานภาพ, copy หรือ UX ต้องมี artifact ให้ผู้ใช้ตรวจเมื่อเกณฑ์อัตโนมัติไม่สามารถตัดสินคุณภาพได้ครบ

Defect ใน checklist, issue หรือ report จะปิดได้เมื่อหลักฐานอ้างกลับไปยัง defect นั้นโดยตรง ไม่ใช่เพียงคำว่า “ดูดีขึ้น”

Related: [[Layered Verification]] · [[Experiment and Decision Records]] · [[Change Impact Records]]

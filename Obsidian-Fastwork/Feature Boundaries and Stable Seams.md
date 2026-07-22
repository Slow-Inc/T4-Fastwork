---
tags:
  - engineering
  - architecture
description: Add features through stable, tested boundaries instead of growing shared cores indefinitely.
source: Adapted from MangaDock feedback-core-boundary
---

# Feature Boundaries and Stable Seams

ฟีเจอร์ใหม่ควรเชื่อมเข้าระบบผ่าน boundary ที่ชัดเจนและทดสอบได้ เช่น module interface, repository, adapter, service contract หรือ pipeline stage แทนการเพิ่ม branch และ responsibility เข้า shared core ไปเรื่อย ๆ

หลักปฏิบัติ:

- ระบุ owner และ contract ของ boundary ก่อนเพิ่ม behavior
- วาง business logic ในหน่วยที่ dependency น้อยและทดสอบแยกได้
- รักษา framework layer ให้ทำหน้าที่ wiring มากกว่ากลายเป็นที่รวม logic
- หลีกเลี่ยงการคัดลอก flow เดียวกันไปหลาย provider หรือหลาย feature
- ถ้ายังไม่มี seam ที่เหมาะสม ให้ถือว่าการสกัด seam ขนาดเล็กภายใต้ characterization tests เป็นส่วนหนึ่งของต้นทุนฟีเจอร์

สำหรับ T4 Fastwork แนวคิดนี้สอดคล้องกับการแยก Next.js presentation/data access, NestJS feature modules และ RAG core ที่ไม่ผูกกับ framework

Related: [[Safe Core Refactoring]] · [[Layered Verification]] · [[Change Impact Records]]

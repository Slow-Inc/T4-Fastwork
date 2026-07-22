---
tags:
  - engineering
  - refactoring
  - testing
description: Refactor shared or high-risk code with characterization-first, one seam at a time, and explicit rollback points.
source: Adapted from MangaDock feedback-decomposition-method and feedback-techdebt-all-scenarios
---

# Safe Core Refactoring

การ refactor โค้ด shared หรือ hot path ต้องเริ่มจากการล็อก behavior ปัจจุบันก่อน แล้วจึงเปลี่ยนทีละ seam ที่ตรวจสอบและย้อนกลับได้

ลำดับที่แนะนำ:

1. ทำ scenario matrix ให้ครอบคลุม happy path, edge cases, failure paths, authorization boundaries และ caller ที่สำคัญ
2. เพิ่ม characterization tests หรือ golden outputs เพื่อบันทึก behavior ปัจจุบัน
3. ย้ายโค้ดโดยไม่เปลี่ยน behavior ในรอบเดียวกัน
4. ตรวจสอบ test net ทั้งชุดหลังแต่ละ seam
5. แยก behavior change เป็นงานถัดไปที่มี test และหลักฐานของตัวเอง

หนึ่ง seam ต่อหนึ่ง reviewable change ทำให้ blast radius เล็กและ rollback ชัดเจน ไม่ควรรวม duplication ที่มีความต่างเชิงพฤติกรรมโดยฝืน abstraction; ถ้าความต่างนั้นจำเป็น ให้ทำเป็น parameter หรือ contract ที่เห็นได้ชัด

Related: [[Feature Boundaries and Stable Seams]] · [[Evidence Before Completion]] · [[Layered Verification]]

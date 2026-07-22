---
tags:
  - engineering
  - workflow
description: Move from a challenged problem statement through repository decisions and TDD to a verified, traceable delivery slice.
source: Adapted from MangaDock docs/agents/workflow.md
---

# From Problem to Verified Slice

การพัฒนาควรเริ่มจากทำให้ปัญหาชัดก่อนทำให้โค้ดเปลี่ยน ลำดับนี้ช่วยลดงานที่ implement ถูกแต่แก้โจทย์ผิด:

1. **Frame the problem:** ระบุผู้ใช้ อาการ เป้าหมาย ข้อจำกัด และสิ่งที่ไม่อยู่ใน scope
2. **Challenge assumptions:** หา edge cases, failure modes, security boundaries และ alternative explanations
3. **Check existing decisions:** อ่าน requirement, ADR, spec และ code path ที่เกี่ยวข้องก่อนออกแบบใหม่
4. **Record the plan:** ใช้ PRD/spec สำหรับงานหลาย slice และ issue สำหรับ deliverable ที่ตรวจสอบได้
5. **Define acceptance evidence:** ระบุ test, E2E, benchmark หรือ artifact ที่จะพิสูจน์งานก่อนเริ่ม implement
6. **Deliver with TDD:** เขียน failing test ก่อน ทำ change ที่เล็กที่สุดให้ผ่าน แล้ว refactor ภายใต้ test net
7. **Verify the real path:** ตรวจ behavior จริง อัปเดตเอกสาร และบันทึก impact/remaining risks

แต่ละ slice ควร trace กลับไปยัง requirement หรือ issue และมีหลักฐานของตัวเอง เพื่อให้ส่งต่อ review หรือ rollback ได้โดยไม่ต้องตีความงานก้อนใหญ่ทั้งหมด

Related: [[Engineering North Star]] · [[Layered Verification]] · [[Living Documentation and Handoffs]]

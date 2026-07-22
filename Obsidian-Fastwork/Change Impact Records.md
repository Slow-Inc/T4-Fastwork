---
tags:
  - engineering
  - reporting
description: Record system-affecting changes with before-after evidence, validation, risk, and rollback information.
source: Adapted from MangaDock feedback-impact-report
---

# Change Impact Records

งานที่มีผลต่อระบบควรมีบันทึกที่ทำให้ผู้อ่านตอบได้ว่าเปลี่ยนอะไร ทำไม ผลจริงคืออะไร และย้อนกลับอย่างไร โดยปรับความละเอียดตามขนาดและความเสี่ยงของงาน

field หลัก:

- What and where: component, module หรือ file ที่เปลี่ยน
- Why: ปัญหา เป้าหมาย หรือ requirement
- Before → After: ความต่างที่สังเกตหรือวัดได้
- Performance delta: ตัวเลขเมื่อวัดแล้ว; ใช้ “not measured” หรือ “N/A” แทนการเดา
- Quality/correctness: ผลต่อ UX, data integrity, security หรือ output quality
- Validation: unit, integration, E2E, benchmark หรือ manual evidence
- Risk and rollback: blast radius, flag/guard และวิธีย้อนกลับ
- Links: issue, ADR, report, commit หรือ PR ที่เกี่ยวข้อง

Bug fix ควรมี symptom, root cause, เหตุที่ root cause สร้าง symptom, fix, validation และ prevention action ส่วน feature/refactor ควรเน้น before/after, architectural impact, metrics และ future opportunities

Related: [[Evidence Before Completion]] · [[Experiment and Decision Records]] · [[Living Documentation and Handoffs]]

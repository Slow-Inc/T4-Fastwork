---
tags:
  - engineering
  - reliability
  - reporting
description: Write a blameless postmortem only after the bug is reproducible, its mechanism is known, the fix is identified, and validation is complete.
source: Adapted from MangaDock docs/reports/post-mortem-template.md
---

# Validated Blameless Postmortems

Post-mortem เป็น engineering record ของ bug ที่รู้กลไกและ validate fix แล้ว ไม่ใช่พื้นที่บันทึกข้อสันนิษฐาน

ต้องมีข้อมูลครบก่อนเขียน:

- reliable reproduction
- root cause ที่อธิบายกลไกได้
- fix หรือ change identifier ที่แน่นอน
- validation ว่า original repro ผ่านแล้ว

โครงสร้างขั้นต่ำ:

1. Summary
2. Symptom และหลักฐานที่สังเกตได้
3. Root cause พร้อม code/component identifiers
4. เหตุที่ cause นั้นสร้าง symptom
5. Fix และเหตุผลว่าทำไมแก้ที่ต้นเหตุ
6. Debugging path รวม hypotheses ที่ถูกปฏิเสธ
7. Why it slipped through โดยอธิบายช่องว่างของระบบอย่าง blameless
8. Validation พร้อมขอบเขตที่ทดสอบจริง
9. Action items หรือระบุว่าไม่จำเป็น

ถ้ายัง reproduce ไม่ได้, root cause ยังเป็น hypothesis หรือ fix ยังไม่ผ่าน original failure path ให้บันทึกเป็น investigation แทนและอย่าเรียกว่า post-mortem

Related: [[Deliberate Diagnosis Loop]] · [[Evidence Before Completion]] · [[Change Impact Records]]

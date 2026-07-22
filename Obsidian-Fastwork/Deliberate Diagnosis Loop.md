---
tags:
  - engineering
  - debugging
description: Diagnose by reproducing, tracing, hypothesizing, and trying to disprove the hypothesis before changing code.
source: Adapted from MangaDock diagnosis workflow and operating lessons
---

# Deliberate Diagnosis Loop

เมื่อระบบพัง ให้ลดความไม่แน่นอนก่อนแก้โค้ด การ retry, reinstall หรือแก้ config แบบสุ่มเพิ่ม state และทำลายหลักฐาน

วงจรที่ใช้:

1. **Reproduce:** ทำให้อาการเกิดซ้ำด้วย input และ environment ที่บันทึกได้
2. **Observe:** อ่าน error, logs, response, database state และ telemetry จาก failure จริง
3. **Trace:** เดินตาม data/control flow ไปยังจุดแรกที่ state ผิด ไม่หยุดที่จุดที่ error โผล่
4. **Hypothesize:** เขียนกลไกที่อธิบายได้ทั้ง cause และ symptom
5. **Try to disprove:** ออกแบบ experiment ที่จะทำให้สมมติฐานผิดได้เร็วที่สุด
6. **Fix the root cause:** เปลี่ยนจุดที่ทำให้ invariant แตก ไม่ปิดบัง symptom
7. **Lock the lesson:** เพิ่ม regression test, ตรวจ real path และบันทึกสิ่งที่ลองแล้วไม่ใช่สาเหตุ

หนึ่ง experiment ที่แยกสมมติฐานได้ชัด มีค่ากว่า retry หลายครั้งที่เปลี่ยนหลายตัวแปรพร้อมกัน

Related: [[Experiment and Decision Records]] · [[Evidence Before Completion]] · [[Validated Blameless Postmortems]]

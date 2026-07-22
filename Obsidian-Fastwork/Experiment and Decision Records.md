---
tags:
  - engineering
  - knowledge
description: Record experiments, measurements, rejected hypotheses, and decisions so the team does not repeat dead ends.
source: Adapted from MangaDock feedback-log-every-experiment-to-md
---

# Experiment and Decision Records

ผลล้มเหลวและสมมติฐานที่ถูกหักล้างมีคุณค่าเท่ากับผลสำเร็จ เพราะช่วยให้ทีมไม่ต้องทดลองทางตันเดิมซ้ำ

สำหรับ experiment หรือ investigation ที่มีนัยสำคัญ ให้บันทึก:

- คำถามหรือสมมติฐานที่กำลังทดสอบ
- environment, input และวิธีวัดที่จำเป็นต่อการทำซ้ำ
- ผลที่วัดได้จริง โดยแยก fact ออกจาก inference
- สิ่งที่ลองแล้วไม่เวิร์คและเหตุผล
- การตัดสินใจที่เกิดขึ้น พร้อม tradeoff
- next step และเงื่อนไขที่อาจทำให้ต้องทบทวนใหม่

เลือกปลายทางตามชนิดความรู้: ADR สำหรับการตัดสินใจที่ย้อนกลับยาก, `docs/reports/` สำหรับ investigation/benchmark, issue สำหรับสถานะงาน และ vault สำหรับบทเรียนที่ใช้ข้ามงานได้

Related: [[Living Documentation and Handoffs]] · [[Evidence Before Completion]] · [[Change Impact Records]]

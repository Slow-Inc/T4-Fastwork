---
tags:
  - engineering
  - principles
description: Prefer the simplest correct, maintainable, sustainable design with performance appropriate to the real workload.
source: Adapted from the MangaDock Engineering North Star
---

# Engineering North Star

> **Simplest logic that works · easy to maintain · sustainable long-term · good performance.**

เมื่อมีหลายทางเลือกที่ถูกต้อง ให้เลือกทางที่ผู้ดูแลคนถัดไปเข้าใจได้เร็วที่สุดและมี moving parts น้อยที่สุด โดยไม่ละเลย performance ของ hot path จริง

หลักตัดสินใจ:

- **Remove complexity:** ถ้าโครงสร้างเปราะหรือ over-built ให้พิจารณาแทนด้วยสิ่งที่เรียบง่ายกว่า แทนการเพิ่ม dependency หรือ layer เพื่อค้ำของเดิม
- **Use the lightest sufficient construct:** ใช้ function, module, data structure หรือ abstraction ที่เบาที่สุดซึ่งยังรักษา contract ได้ครบ
- **Extract when testability pays:** แยก logic เมื่อทำให้ทดสอบได้เร็วขึ้น ลด dependency หรือสร้าง boundary ที่ชัดขึ้น ไม่แยกเพียงเพื่อให้จำนวนไฟล์เพิ่ม
- **Make surgical changes:** แตะเฉพาะสิ่งที่เป้าหมายต้องการ รักษารูปแบบรอบข้าง และลบเฉพาะ orphan ที่การเปลี่ยนแปลงนั้นสร้าง
- **Optimize measured hot paths:** performance สำคัญ แต่ต้องอิง profiling/measurement และไม่แลก clarity กับ micro-optimization ที่ไม่มีผลจริง

คำถามก่อนยอมรับ design:

1. มีวิธีที่ง่ายกว่านี้แต่ยังถูกต้องครบหรือไม่
2. complexity ทุกชั้นแก้ constraint จริงข้อใด
3. คนใหม่สามารถหา owner, contract และ failure path ได้หรือไม่
4. ถ้าต้องย้อนกลับ จะทำได้เล็กและปลอดภัยเพียงใด
5. performance claim มีการวัดรองรับหรือเป็นเพียงการคาดเดา

Related: [[Feature Boundaries and Stable Seams]] · [[Small Reversible Delivery]] · [[Evidence Before Completion]]

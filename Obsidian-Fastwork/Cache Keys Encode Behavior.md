---
tags:
  - engineering
  - caching
  - correctness
description: A cache key must encode every input that can materially change the cached output, including versioned configuration.
source: Adapted from MangaDock ADR 011 render-config-hash cache key
---

# Cache Keys Encode Behavior

Cache correctness เริ่มจาก identity ของผลลัพธ์ ถ้า input หรือ configuration ใดเปลี่ยน output ได้แต่ไม่อยู่ใน key ระบบจะ replay ข้อมูลเก่าที่ดูถูกต้องและตรวจจับยาก

หลักปฏิบัติ:

- รวมทุก semantic input ที่กระทบ output ไม่ใช่แค่ request parameters ที่มองเห็นง่าย
- canonicalize ก่อน hash เช่น sort keys และ normalize representation
- ใส่ explicit version segment เมื่อ algorithm/schema เปลี่ยน
- ให้ key builder, invalidation/reset selector และ consumer ใช้ shared constants หรือ contract เดียวกัน
- ทดสอบทั้ง collision, omission, version bump และ selective invalidation
- บันทึก cardinality/cost เพราะ key ที่ถูกต้องแต่ละเอียดเกินอาจทำให้ hit rate หรือ storage แย่ลง

Related: [[Scoped Destructive Operations]] · [[Evidence Before Completion]] · [[Change Impact Records]]

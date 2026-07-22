---
tags: [architecture, correctness, refactoring]
description: Transform only the selected subset while preserving unaffected output exactly when required.
source: Adapted from MangaDock ADR 004 and branch reconciliation quality gates
---

# Contract-Preserving Transformations

งานแปลงบางส่วนต้องนิยามว่าอะไรเปลี่ยนได้และอะไรต้องคงเดิม หาก contract ต้องการความเท่าเดิม ให้พิสูจน์ unaffected region แบบ byte-identical หรือ semantic-equivalent ตามชนิดข้อมูล

- กำหนด selection boundary ก่อน transform
- รักษา ordering, identity และ metadata ของส่วนที่ไม่ถูกเลือก
- ใช้ characterization fixture/golden ก่อน refactor
- เปรียบเทียบทั้ง output และ side effects
- อย่ารวม mode ที่มี correctness invariant ต่างกันเพียงเพื่อลดจำนวน branch

Related: [[Safe Core Refactoring]] · [[Evidence Before Completion]]

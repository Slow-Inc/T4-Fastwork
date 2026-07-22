---
tags:
  - engineering
  - architecture
  - documentation
description: Record hard-to-reverse decisions with context and consequences, and supersede rather than rewriting history.
source: Adapted from MangaDock docs/adr/README.md
---

# ADR Lifecycle and Supersession

ADR บันทึก decision ที่สำคัญและย้อนกลับยากหลังจากมีข้อสรุปชัด โดยเก็บ context, decision, alternatives และ consequences เพื่อให้คนถัดไปกู้เหตุผลได้โดยไม่ต้องอนุมานใหม่

กฎสำคัญ:

- ground claim ในระบบจริงและอ้าง component/file ที่ตรวจสอบได้
- แยก status เช่น Proposed, Accepted, Superseded และ Rejected ให้ชัด
- หมายเลขต้องไม่ชนและ index ต้องเป็น authoritative registry
- เมื่อ decision ใหม่กลับทิศของเดิม ให้สร้าง ADR ใหม่และทำ cross-link `Superseded by` / `Supersedes`
- อย่าแก้ ADR เก่าให้ดูเหมือนทีมตัดสินใจใหม่มาตั้งแต่แรก เพราะจะทำลาย causal history
- decision ที่ยังไม่ implement ต้องระบุว่า planned/pending เพื่อไม่ให้ผู้อ่านเข้าใจว่า live แล้ว

Related: [[Documentation Truth Hierarchy]] · [[Experiment and Decision Records]] · [[Change Impact Records]]

---
tags:
  - engineering
  - domain
  - communication
description: Use one canonical vocabulary across code, issues, tests, and docs to prevent hidden model drift.
source: Adapted from MangaDock UBIQUITOUS_LANGUAGE.md and docs/agents/domain.md
---

# Ubiquitous Language as a System Boundary

คำศัพท์ไม่ใช่เพียง style; คำเดียวกันที่มีหลายความหมายทำให้ model, API, test และการสื่อสาร drift โดยไม่มี compiler เตือน

หลักปฏิบัติ:

- กำหนด canonical term พร้อมนิยามและคำที่ควรหลีกเลี่ยง
- ใช้คำเดียวกันใน issue title, hypothesis, test name, API contract และเอกสาร
- ระบุ ambiguity ที่พบบ่อย เช่น object เดียวมีชื่อเก่าใน route แต่ชื่อใหม่ใน domain
- ถ้าจำเป็นต้อง map vocabulary ของ provider ให้ทำที่ adapter/anti-corruption boundary
- เมื่อพบ concept ใหม่ ให้ตรวจว่ากำลังสร้างคำพ้องโดยไม่จำเป็นหรือเป็น domain gap จริง
- การเปลี่ยนคำที่ load-bearing ต้องวาง migration plan ไม่ใช่ search-and-replace แบบ blind

Related: [[Anti-Corruption Layers at External Boundaries]] · [[Documentation Truth Hierarchy]] · [[Feature Boundaries and Stable Seams]]

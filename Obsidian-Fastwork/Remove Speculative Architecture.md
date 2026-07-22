---
tags:
  - engineering
  - architecture
  - simplicity
description: Do not keep infrastructure for a future topology when no live consumer exists; document the trigger for reintroducing it correctly.
source: Adapted from MangaDock ADR 020 dead Redis pub-sub removal
---

# Remove Speculative Architecture

Infrastructure ที่มี producer แต่ไม่มี consumer จริง, test ค้ำ dead path หรือรองรับ topology ที่ยังไม่ deploy สร้าง complexity โดยไม่ให้ reliability

ก่อนลบให้พิสูจน์:

- enumerate call sites และ runtime consumers
- trace current deployment topology
- characterization-test behavior ที่มีผู้ใช้จริง
- แยก dead capability ออกจาก dependency ที่ส่วนอื่นยังใช้
- ระบุข้อจำกัดที่ชัดขึ้นหลังลบ

บันทึก reversal trigger เช่น “เมื่อ deploy multi-instance และมี cross-instance listener จริง ให้เพิ่ม subscriber พร้อม integration test” ไม่ใช่เก็บ half-implementation ไว้เผื่ออนาคต

Related: [[Engineering North Star]] · [[Safe Core Refactoring]] · [[ADR Lifecycle and Supersession]]

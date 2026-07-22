---
tags: [architecture, decisions, evidence]
description: Re-measure old constraints and supersede decisions when their assumptions no longer hold.
source: Adapted from MangaDock ADR 001 and branch reconciliation records
---

# Constraint Revalidation and Decision Reversal

ADR ที่ถูกต้องในอดีตอาจผิดในบริบทใหม่ เมื่อ cost, traffic, platform หรือ quality constraint เปลี่ยน ให้ตรวจ assumption ด้วยหลักฐานแทนการยึด decision เดิม

- ระบุ assumption ที่ทำให้เลือกทางเดิม
- วัดสภาพปัจจุบันด้วยเกณฑ์ที่ reproduce ได้
- บันทึกผลกระทบและ migration/rollback
- สร้าง ADR ใหม่เพื่อ supersede; อย่าแก้ประวัติย้อนหลัง
- เก็บ fallback หรือ escalation ladder จนกว่าทางใหม่พิสูจน์ตัวเอง

Related: [[ADR Lifecycle and Supersession]] · [[Experiment and Decision Records]]

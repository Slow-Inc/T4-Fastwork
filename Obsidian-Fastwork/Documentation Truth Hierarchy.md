---
tags:
  - engineering
  - documentation
  - knowledge
description: Give each document class an explicit authority and lifecycle so stale snapshots cannot override current system truth.
source: Adapted from MangaDock docs indexes and Documents/DOCUMENT_INDEX.md
---

# Documentation Truth Hierarchy

เอกสารหลายชนิดตอบคนละคำถามและมีอายุไม่เท่ากัน ต้องระบุว่าอะไรคือ source of truth และอะไรเป็นเพียง snapshot เพื่อป้องกันเอกสารเก่าชนะระบบจริง

ลำดับที่เหมาะกับ T4 Fastwork:

1. Code, schema และ runtime configuration คือหลักฐานของ behavior ที่ใช้งานจริง
2. Requirement และ accepted ADR คือข้อกำหนดและเหตุผลของ decision
3. Current design/spec และ runbook อธิบายโครงสร้างและวิธีปฏิบัติที่ยังใช้อยู่
4. Issue และ open-work ledger แสดงสถานะงานปัจจุบัน
5. Dated reports, research และ benchmarks เป็น point-in-time evidence
6. Academic, presentation หรือ archived docs เป็น historical context ไม่ใช่ authority

ทุก index ควรติดสถานะอย่างน้อย `LIVING`, `SNAPSHOT`, `ARCHIVED` หรือ `TEMPLATE` และบอก recommended reading path เมื่อมีเอกสารหลายชั้น

Related: [[Living Documentation and Handoffs]] · [[ADR Lifecycle and Supersession]] · [[Incremental Survey Manifests]]

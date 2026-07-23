---
tags:
  - index
  - engineering
description: Reusable engineering practices adapted for T4 Fastwork from lessons learned in MangaDock.
source: MangaDock engineering memory, adapted for T4 Fastwork on 2026-07-22
---

# Engineering Knowledge Index

แนวปฏิบัติชุดนี้ย้าย “บทเรียนที่ใช้ซ้ำได้” จาก MangaDock มาปรับให้เข้ากับ T4 Fastwork โดยตั้งใจเก็บเฉพาะหลักการข้ามโดเมน ไม่ย้ายข้อกำหนดเฉพาะระบบแปลมังงะหรือสถานะงานของ MangaDock

- [[Engineering North Star]]
- [[Architecture Principles Index]]
- [[Delivery and Quality Index]]
- [[Knowledge Management Index]]
- [[Security and Reliability Index]]
- [[Operations and Performance Index]]

ข้อกำหนดใน `CLAUDE.md`, ADR, issue และเอกสาร canonical ของ T4 Fastwork มีลำดับความสำคัญเหนือโน้ตชุดนี้เสมอ

- [[Drizzle Raw SQL Array Binding]] — bare `${jsArray}` in a drizzle `sql` template expands to placeholders (a row/tuple), not a single array value; use `array[...]::text[]`. A SQL-capture test catches it.

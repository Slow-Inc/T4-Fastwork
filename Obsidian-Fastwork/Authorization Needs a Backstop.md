---
tags:
  - engineering
  - security
  - authorization
description: Privileged credentials turn every query into an authorization boundary; enforce least privilege and database backstops where possible.
source: Lesson extracted from MangaDock ADR 013; aligned to T4 Fastwork ADR 0007 rather than copying MangaDock's decision
---

# Authorization Needs a Backstop

Credential ที่ bypass RLS หรือมีสิทธิ์ข้าม tenant ทำให้ query ทุกจุดกลายเป็น security boundary การลืม ownership predicate เพียงครั้งเดียวอาจคืนข้อมูลข้าม user โดยไม่มี error

สำหรับ T4 Fastwork ให้ยึด ADR 0007:

- enforce authorization ในฐานข้อมูลด้วย RLS และ grants เป็นหลัก
- ใช้ application assertion เป็น defense-in-depth ไม่ใช่ boundary เดียว
- จำกัด privileged client ให้อยู่ใน backend flow ที่จำเป็นและไม่ expose สู่ browser
- แยก authentication, role check และ resource ownership ออกจากกัน; JWT valid ไม่ได้แปลว่าเป็นเจ้าของ row
- test ทั้ง allowed และ denied paths รวม cross-user/cross-role attempts
- production bypass หรือ test secret ต้อง fail at boot/runtime อย่างชัดเจน

บทเรียนที่ย้ายมาคือ failure mode ของ privileged access ไม่ใช่การย้าย decision ของ MangaDock ซึ่งเลือก architecture คนละแบบ

Related: [[Authoritative Validation at Trust Boundaries]] · [[Identity Transition Cache Isolation]] · [[Layered Verification]]

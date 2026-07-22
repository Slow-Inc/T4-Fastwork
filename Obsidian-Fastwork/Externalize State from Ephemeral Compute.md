---
tags:
  - engineering
  - architecture
  - deployment
description: Keep durable state outside disposable compute so instances can scale, restart, or spin down without data loss.
source: Adapted from MangaDock ADR 001 and ADR 021
---

# Externalize State from Ephemeral Compute

Compute ที่ deploy ใหม่, scale to zero หรือถูกแทนที่ต้องถือว่า disposable ข้อมูล durable จึงควรอยู่ใน database, object storage หรือ service ที่ออกแบบเพื่อ persistence

แยกให้ชัด:

- local memory ใช้ลด latency ไม่ใช่ durable truth
- local disk ใช้ได้กับ temporary files หรือ cache ที่ rebuild ได้
- database เก็บ transactional/relational state
- object storage เก็บ binary และ large immutable assets
- metadata และ binary ไม่จำเป็นต้องอยู่ระบบเดียวกัน แต่ต้องมี stable identifier เชื่อมกัน

runbook ต้องพิสูจน์ว่า spin down/redeploy แล้ว state ยังอยู่, cache rebuild ได้ และ cold start/fallback ถูกจัดการ การ externalize state เพิ่ม dependency/cost จึงควรประเมินจาก recovery, availability และ traffic จริง

Related: [[Documentation Truth Hierarchy]] · [[Small Reversible Delivery]] · [[Change Impact Records]]

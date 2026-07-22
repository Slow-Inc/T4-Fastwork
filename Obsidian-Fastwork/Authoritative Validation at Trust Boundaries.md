---
tags:
  - engineering
  - security
  - validation
description: Validate untrusted input using authoritative evidence at the layer that can inspect it, while keeping cheap early filters as non-security gates.
source: Adapted from MangaDock ADR 012 raw-byte HMAC and ADR 016 magic-byte MIME validation
---

# Authoritative Validation at Trust Boundaries

ข้อมูลที่ผู้เรียกควบคุม เช่น filename, Content-Type, serialized JSON หรือ URL ไม่ควรเป็น security authority ต้องตรวจจาก representation ที่ load-bearing จริงและทำใน layer ที่เข้าถึงหลักฐานนั้นได้

ตัวอย่างหลักการ:

- file upload: ตรวจ magic bytes หลังมี bytes จริง; header filter เป็นเพียง early rejection
- webhook signature: verify บน raw bytes ที่ผู้ส่ง sign ไม่ใช่ re-serialized object
- URL/input: parse และ allow-list scheme/host ตาม use case
- production secret: missing configuration ต้อง fail closed ไม่ fallback เป็น open path
- derived metadata เช่น extension/content type ต้องมาจาก detected result ไม่ใช่ client claim

validation failure ต้อง cleanup temporary state และมี negative tests สำหรับ spoofed, truncated, malformed และ missing-secret paths

Related: [[Anti-Corruption Layers at External Boundaries]] · [[Authorization Needs a Backstop]] · [[Evidence Before Completion]]

---
tags:
  - engineering
  - documentation
description: Keep executable commands, scripts, examples, and operator documentation synchronized.
source: Adapted from MangaDock feedback-update-readme-on-command-change
---

# Command Documentation Synchronization

เมื่อเพิ่ม เปลี่ยนชื่อ ย้าย หรือลบ command, script, flag หรือ developer utility ให้ปรับเอกสารที่ผู้ใช้ command นั้นเปิดอ่านจริงใน change เดียวกัน

ตรวจอย่างน้อย:

- root README หรือ package README ที่เป็นเจ้าของ command
- `CLAUDE.md` เมื่อ command เป็นส่วนหนึ่งของ agent workflow
- `.env.example` เมื่อ command ต้องใช้ configuration ใหม่
- deploy/runbook เมื่อกระทบ operator หรือ production flow
- test/CI configuration เมื่อ command ที่ automation เรียกเปลี่ยน

ตรวจสอบด้วยการรัน command จริงและอ่าน output; การแก้เฉพาะเอกสารโดยไม่พิสูจน์ว่า command ทำงาน หรือแก้เฉพาะ script โดยปล่อยตัวอย่างเก่าไว้ ถือว่ายังไม่ครบ

Related: [[Living Documentation and Handoffs]] · [[Layered Verification]]

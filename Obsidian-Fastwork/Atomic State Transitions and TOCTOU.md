---
tags: [architecture, data, correctness]
description: Keep correctness-critical reads and writes inside one authoritative transaction.
source: Adapted from MangaDock payment/unlock PRDs and correctness reports
---

# Atomic State Transitions and TOCTOU

ข้อมูลที่ใช้ตัดสินใจและการเปลี่ยนสถานะที่ตามมาต้องเกิดใน transaction เดียวกันเมื่อมีผลต่อเงิน สิทธิ์ quota หรือ ownership อย่าเชื่อราคา สถานะ หรือสิทธิ์ที่ caller อ่านมาก่อน เพราะข้อมูลอาจเปลี่ยนระหว่างตรวจและเขียน (TOCTOU)

- อ่านค่าปัจจุบันจาก authoritative store ภายใน transaction
- ตรวจ invariant และเขียนผลแบบ atomic หรือมี compensating action ที่พิสูจน์ได้
- ให้ฐานข้อมูลบังคับ uniqueness และ state-transition constraints เมื่อทำได้
- ทดสอบ concurrent callers, retries และ partial failure โดยตรง

Related: [[Idempotent Event Processing]] · [[Authoritative Validation at Trust Boundaries]]

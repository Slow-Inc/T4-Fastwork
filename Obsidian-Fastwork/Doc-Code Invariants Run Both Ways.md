---
tags:
  - engineering
  - documentation
  - quality
description: A test that binds a document to code must fail in both directions, and exporting a constant so a test can see it must not widen what the code allows.
source: T4 Fastwork #257 — ADR 0015's additive list vs. isAdditiveMigration
---

# Doc-Code Invariants Run Both Ways

เมื่อเอกสารตัดสินใจอะไรที่โค้ดบังคับใช้ (list ของรูปแบบที่อนุญาต, ตารางที่อ้างว่ามีกลไก, ชุด flag ที่รองรับ)
การผูกทั้งสองด้วยเทสต์คือวิธีที่ถูก — แต่ **เทสต์ที่ตรวจทางเดียวจับได้แค่ครึ่งเดียวของ drift** และครึ่งที่มัน
ปล่อยผ่านมักเป็นครึ่งที่เงียบกว่า

สองทิศทางที่ต้องยืนยันแยกกัน:

- **เอกสารอ้างเกินโค้ด** — ทุกอย่างที่เอกสารบอกว่าทำได้ ต้องผ่านโค้ดจริง · ทิศนี้ล้มเสียงดังอยู่แล้วเพราะ
  ตัวอย่างที่ผิดจะถูกโค้ดปฏิเสธ
- **โค้ดทำเกินเอกสาร** — ทุกความสามารถที่โค้ดมี ต้องมีอยู่ในเอกสาร · ทิศนี้**เงียบ**: เพิ่มรายการใน list ของ
  โค้ดโดยไม่แก้เอกสาร แล้วเทสต์ที่ตรวจแต่ตัวอย่างของเอกสารยังเขียวทั้งที่เอกสารบอกน้อยกว่าความจริงแล้ว

ใน #257 ทั้งสองทิศเกิดขึ้นจริงพร้อมกัน: ADR 0015 เรียก `create or replace view` ว่า additive (classifier
ปฏิเสธ) และไม่ระบุ `create schema/extension if not exists` (classifier ยอมรับ) · เทสต์ฉบับแรกจับได้แค่ข้อแรก

## ยืนยันว่า assertion มีฟันด้วย mutation

red ที่มาจาก "ยังไม่มี marker ในเอกสาร" ไม่ได้พิสูจน์อะไรเกี่ยวกับความแหลมของ assertion · ให้ใส่ **คำอ้างเดิม
ที่ผิด** เข้าไปก่อนแล้วดูว่าเทสต์ชี้ชื่อรายการนั้นตรงตัวหรือไม่ · จากนั้นลบตัวอย่างหนึ่งรายการออกเพื่อดูว่าทิศ
"โค้ดทำเกินเอกสาร" ล้มจริง · ทั้งสองครั้งคือหลักฐานเดียวกับที่วงจร red-first ให้

## การ export เพื่อให้เทสต์มองเห็น ต้องไม่ทำให้แก้ได้

ทิศ "โค้ดทำเกินเอกสาร" มักบังคับให้ export ค่าคงที่ที่เคยเป็น private ออกมา · ถ้าค่านั้นคือขอบเขตความปลอดภัย
การ export `RegExp[]` เปล่าเปิดให้ importer ใดก็ตาม `push` ขยายขอบเขตตอน runtime ได้ — กลายเป็นการเพิ่ม
จุดอ่อนเพื่อให้เทสต์ผ่าน · ใช้ `readonly` (compile-time) คู่กับ `Object.freeze` (runtime) และยืนยันด้วยการลอง
กลายพันธุ์จริง ไม่ใช่ด้วยการอ่าน type

Related: [[Documentation Truth Hierarchy]] · [[Documentation Can Affect Runtime]] ·
[[Command Documentation Synchronization]] · [[Evidence Before Completion]] ·
[[Authorization Needs a Backstop]]

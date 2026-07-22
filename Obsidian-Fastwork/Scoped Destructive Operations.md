---
tags:
  - engineering
  - operations
  - safety
description: Destructive maintenance actions must select an explicit namespace or verified target and prove adjacent data remains untouched.
source: Adapted from MangaDock ADR 011 selective namespace reset
---

# Scoped Destructive Operations

การ reset, purge, delete หรือ invalidate ต้องเลือก target ที่แคบและตรวจสอบได้ หลีกเลี่ยง global clear เมื่อเป้าหมายอยู่เพียง namespace เดียว

ก่อนดำเนินการ:

- resolve target แบบ read-only และแสดงจำนวน/ตัวอย่างรายการที่จะได้รับผล
- ใช้ explicit prefix, IDs หรือ ownership predicate แทน broad glob
- มี dry-run เมื่อ operation มี blast radius สูง
- ทดสอบ positive selection และ negative preservation ว่าข้อมูลข้างเคียงไม่ถูกแตะ
- ทำให้ partial failure มองเห็นได้และกำหนดว่าจะ continue, retry หรือ rollback อย่างไร
- บันทึก recovery path และสิ่งที่กู้คืนไม่ได้

Related: [[Small Reversible Delivery]] · [[Cache Keys Encode Behavior]] · [[Evidence Before Completion]]

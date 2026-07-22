---
tags: [delivery, git, operations]
description: Delete merged PR branches promptly while preserving default, active, long-lived, and unverified work.
source: User operating rule established for T4 Fastwork on 2026-07-23
---

# Merged Branch Cleanup

branch ของ PR ที่ merge แล้วต้องถูกลบทั้ง remote และ local เพื่อไม่ให้รายการ branch สะสมจนแยก
งานที่ยัง active ออกจากงานเก่าไม่ได้

ขั้นตอนหลัง merge:

1. ยืนยันสถานะ `MERGED` จาก PR/hosting provider; ancestry อย่างเดียวไม่พอสำหรับ squash merge
2. ตรวจว่า remote head branch ถูกลบแล้ว ถ้ายังอยู่ให้ลบเฉพาะ branch ที่ยืนยันนั้น
3. รัน fetch/prune เพื่อเอา remote-tracking ref ที่หมดอายุออก
4. switch ออกจาก branch แล้วลบ local copy ด้วย safe deletion (`git branch -d`)

ห้ามลบ default branch, branch ปัจจุบัน, branch ระยะยาวที่กำหนดไว้ หรือ branch ที่ยังยืนยัน merge
ไม่ได้ ห้ามใช้ force deletion เพื่อทำความสะอาด branch ที่เพียงแค่ “ดูเก่า”

Related: [[Small Reversible Delivery]] · [[Release Truth and Rollback Drills]] · [[Scoped Destructive Operations]]

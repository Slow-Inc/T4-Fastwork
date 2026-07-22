---
tags:
  - engineering
  - security
  - caching
description: Treat sign-in, sign-out, and account switching as security boundaries for every user-influenced cache and local store.
source: Adapted from MangaDock ADR 015 cross-user cache isolation
---

# Identity Transition Cache Isolation

Cache ที่อยู่ได้นานกว่า user session สามารถทำให้ข้อมูลของ user A รั่วไป user B บนอุปกรณ์หรือ tab เดียวกันได้ แม้ API authorization จะถูกต้อง

เมื่อ identity เปลี่ยน:

- clear หรือ rotate ทุก cache/store ที่มีข้อมูล user-influenced
- รวม transition handling ไว้ที่ boundary เดียวเพื่อลด call site ที่ลืมได้
- ถ้าใช้ per-user cache key ต้องพิสูจน์ว่า entry ทุกชนิดถูก scope ถูกต้อง; full clear มักปลอดภัยกว่าเมื่อ cache เล็ก
- ครอบคลุม sign-in, sign-out, account switch, token invalidation และ account deletion
- เพิ่ม regression test ที่สลับ A → B และยืนยันว่า B ไม่เห็นข้อมูลจาก A

ยอมเสีย cache hit ของข้อมูล public บางส่วนได้ หากแลกกับ privacy guarantee ที่ correct-by-construction

Related: [[Authorization Needs a Backstop]] · [[Cache Keys Encode Behavior]] · [[Authoritative Validation at Trust Boundaries]]

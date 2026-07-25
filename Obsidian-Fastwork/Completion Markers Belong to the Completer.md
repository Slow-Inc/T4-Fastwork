---
tags: [architecture, reliability, events, contracts]
description: Only the process that finishes work may write its completion marker, and a shared decision rule needs one implementation.
source: Validated on T4-Fastwork event-driven cover recapture (#185 → #195 / #197, 2026-07-25)
---

# Completion Markers Belong to the Completer

เมื่องานถูกส่งต่อข้าม process (dispatch แล้วอีกฝั่งทำจริงในภายหลัง) ผู้ที่ **เริ่ม** งานต้องไม่เขียน marker ที่แปลว่า "งานเสร็จแล้ว" เพราะฝั่งที่ทำจริงจะอ่าน marker นั้นเพื่อตัดสินว่าตัวเองยังต้องทำอะไร แล้วเจอค่าที่ผู้เริ่มเพิ่งเขียนไปเอง จึงสรุปว่า "ไม่มีอะไรต้องทำ" — ฟีเจอร์ตายเงียบ ๆ โดยเทสต์ทั้งชุดยังเขียว

กรณีที่พิสูจน์แล้ว: Nest เขียน `projects.last_capture_trigger` ตอน dispatch GitHub Action ส่วน worker ที่บูตตามหลัง ~30–60 วินาที เทียบ trigger ที่ได้รับกับค่าในแถวนั้น พบว่าเท่ากัน แล้วรายงาน "nothing to capture" ทำให้การถ่ายปกใหม่ไม่เกิดขึ้นเลยกับโปรเจกต์ที่มีปกอยู่แล้ว ซึ่งเป็นฟีเจอร์หลักของ epic ทั้งใบ

- แยกสองสิ่งให้ชัด: **"ส่งงานไปแล้วเมื่อไร"** (ผู้เริ่มเขียน ใช้คุม cooldown/rate limit) กับ **"งานเสร็จด้วย token ไหน"** (ผู้ทำเขียน ใช้คุม idempotency)
- ผู้ทำเขียน marker **หลัง** ผลลัพธ์ถูก persist แล้วเท่านั้น ไม่ใช่ตอนเริ่มทำ
- dispatch ที่ไม่สำเร็จ (non-2xx) ต้องไม่บันทึกอะไร ไม่เช่นนั้น cooldown จะกด retry ของความล้มเหลวที่ไม่มีใครเห็น — ดู [[Degraded Modes Must Be Observable]]
- กฎการตัดสิน ("อันนี้ต้องทำงานไหม") ที่สอง process ใช้ร่วมกัน ต้องมี implementation เดียวที่ทั้งคู่ import ไม่ใช่คนละสำเนาที่คอมเมนต์กำกับว่า "mirrors X" — สำเนาที่ mirror กันจะ drift และไม่มีเทสต์ไหนจับได้
- เทสต์ที่ครอบเรื่องนี้ต้องเดินข้ามขอบเขต process จริง (plan → dispatch → การเลือกของผู้ทำ) เทสต์ที่หยุดอยู่ที่ executor ปลอมจะผ่านทั้งที่ฟีเจอร์เสีย — ดู [[Layered Verification]]

Related: [[Idempotent Event Processing]] · [[Cross-Service Contract Compatibility]] · [[Degraded Modes Must Be Observable]] · [[Atomic State Transitions and TOCTOU]]

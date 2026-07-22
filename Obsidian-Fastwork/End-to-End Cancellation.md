---
tags:
  - engineering
  - reliability
  - performance
description: Cancellation only saves resources when the signal propagates through every hop to the component doing the expensive work.
source: Adapted from MangaDock ADR 014 abort propagation chain
---

# End-to-End Cancellation

การปิดหน้า ยกเลิก request หรือ disconnect จะหยุดงานแพงได้ต่อเมื่อ cancellation signal เดินครบทุก hop จนถึง worker/provider ที่ใช้ทรัพยากรจริง

ตรวจ chain แบบ end-to-end:

1. client aborts
2. gateway/proxy forwards the signal
3. controller detects closed connection
4. job registry removes the listener and decides whether work is still needed
5. downstream request/worker receives cancellation
6. long-running loop checks cancellation at safe boundaries
7. resources, timers และ subscriptions ถูก cleanup

unit test เฉพาะ worker ไม่สามารถพิสูจน์ proxy hop ได้ ต้องมี integration/E2E evidence และ telemetry ว่างาน downstream หยุดจริง ไม่ใช่เพียง UI เลิกแสดงผล

Related: [[Layered Verification]] · [[Feature Boundaries and Stable Seams]] · [[Change Impact Records]]

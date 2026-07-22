---
tags: [performance, experiments, engineering]
description: Isolate and measure the mechanism under change before drawing whole-system conclusions.
source: Adapted from MangaDock performance references and benchmark reports
---

# Measure Performance at the Mechanism

performance claim ต้องวัดตรง seam ที่เปลี่ยน เพราะ whole-run A/B อาจถูก noise, nondeterminism หรือ cache กลบ

- เริ่มจาก microbenchmark ของ mechanism ที่สงสัย
- ตามด้วย production-like end-to-end เพื่อดู interaction และ regression
- pin input, environment, warm/cold state และ concurrency
- รายงาน variance และข้อจำกัดของ attribution
- พิสูจน์ correctness parity ควบคู่กับความเร็ว

Related: [[Baselines Before Optimization]] · [[Experiment and Decision Records]]

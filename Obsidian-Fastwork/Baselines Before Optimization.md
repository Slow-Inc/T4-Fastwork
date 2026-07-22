---
tags: [performance, verification, experiments]
description: Capture a reproducible baseline before changing performance or subjective quality.
source: Adapted from MangaDock research and render-quality campaigns
---

# Baselines Before Optimization

ก่อนปรับ performance หรือคุณภาพ ให้ snapshot baseline ที่ผูกกับ commit, input, environment, configuration และ artifact มิฉะนั้นคำว่า “ดีขึ้น” ตรวจย้อนหลังไม่ได้

- เก็บ metric และตัวอย่าง output ก่อนเปลี่ยน
- แยก warm/cold cache และ resource co-residency
- ใช้ input เดิมและเกณฑ์ตัดสินเดิมหลังเปลี่ยน
- บันทึก trade-off และ regression ที่ยอมรับไม่ได้
- เก็บ artifact ที่จำเป็นต่อการ reproduce โดยไม่รวม secret หรือข้อมูลส่วนบุคคล

Related: [[Measure Performance at the Mechanism]] · [[Evidence Before Completion]]

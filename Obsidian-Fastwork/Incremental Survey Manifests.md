---
tags:
  - engineering
  - knowledge
  - repository-analysis
description: Record survey provenance so future audits can diff changed material instead of rereading the whole repository.
source: Adapted from MangaDock docs/reports/survey-manifest/README.md
---

# Incremental Survey Manifests

การสำรวจ codebase ขนาดใหญ่ควรสร้าง provenance cache เพื่อให้รอบถัดไปอ่านเฉพาะสิ่งที่เปลี่ยน ไม่เริ่มจากศูนย์ทุกครั้ง

entry ของไฟล์ควรเก็บ:

- path และ last observed commit SHA
- coverage ที่อ่านจริง เช่น full หรือช่วงบรรทัด
- read date
- findings พร้อม code identifiers

entry ของ issue/PR ควรเก็บ state, `updated_at`, read date และ findings เมื่อกลับมาสำรวจ ให้เทียบ SHA/timestamp ก่อน ถ้าไม่เปลี่ยนให้ข้าม; ถ้าเปลี่ยนให้อ่าน diff ก่อนอ่านไฟล์เต็ม

manifest เป็น provenance ของการสำรวจ ไม่ใช่ source of truth ของ behavior และต้องลิงก์ไปยัง report/ADR ที่นำ findings ไปใช้

Related: [[Documentation Truth Hierarchy]] · [[Experiment and Decision Records]] · [[Living Documentation and Handoffs]]

---
tags: [documentation, architecture, delivery]
description: Treat documentation files as executable inputs when tooling builds, indexes, or publishes them.
source: Adapted from MangaDock documentation restructuring and docs-site reports
---

# Documentation Can Affect Runtime

Markdown ไม่ได้เป็นเพียงข้อความเสมอไป หากถูก build เป็น docs site, indexed, embedded หรืออ่านเป็น agent bootstrap การย้าย/rename/delete อาจเปลี่ยน runtime และ discovery behavior

- สำรวจ inbound links, build config, navigation และ ingestion ก่อนย้าย
- แยก canonical instruction, generated output, historical record และ personal note
- เพิ่ม redirect/alias หรืออัปเดต consumer ทั้งหมดเมื่อ path เปลี่ยน
- ตรวจ rendered docs/search/agent bootstrap หลังแก้
- อย่าให้เอกสารประวัติศาสตร์แอบกลายเป็น current source of truth

Related: [[Documentation Truth Hierarchy]] · [[Command Documentation Synchronization]]

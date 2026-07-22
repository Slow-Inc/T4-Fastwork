---
tags: [architecture, contracts, integration]
description: Coordinate wire-contract changes across producers and consumers and test drift explicitly.
source: Adapted from MangaDock component contracts and ADR 020
---

# Cross-Service Contract Compatibility

contract ข้าม service รวมถึง schema, route, status, event, config key และ serialization เป็น API แม้ไม่เปิดสู่สาธารณะ

- มี canonical owner และระบุ producer/consumer ทุกฝั่ง
- เปลี่ยนสองฝั่งเป็นหน่วยเดียว หรือใช้ compatibility window ที่ออกแบบไว้
- เพิ่ม contract test สำหรับ shape, optionality, ordering และ error behavior
- default ใหม่ต้องไม่เปลี่ยนพฤติกรรมเดิมโดยไม่ตั้งใจ
- rollout และ rollback ต้องรองรับ version mismatch ชั่วคราว

Related: [[Anti-Corruption Layers at External Boundaries]] · [[Contract-Preserving Transformations]]

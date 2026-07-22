---
tags:
  - engineering
  - architecture
  - integration
description: Translate external wire and provider models into stable domain contracts at one explicit boundary.
source: Adapted from MangaDock ADR 012, ADR 015, and storage provider boundary
---

# Anti-Corruption Layers at External Boundaries

อย่าให้ wire format, SDK type หรือ provider vocabulary ไหลเข้า domain ทั้งระบบ ให้แปลงมันที่ boundary เดียวเป็น contract ที่แอปเป็นเจ้าของ

boundary ที่พบบ่อย:

- OAuth/provider user → stable application user
- external webhook payload → validated domain event/result
- storage SDK → `StorageProvider`-style interface
- LLM/provider response → application-owned model
- database snake_case row → domain/view model

adapter ต้องรับผิดชอบ validation, normalization, error mapping และ bidirectional mapping เมื่อจำเป็น ส่วน service/domain ไม่ควรรู้ field quirks ของ provider การเปลี่ยน provider จึงกระทบเฉพาะ seam แทนทั้ง codebase

Related: [[Feature Boundaries and Stable Seams]] · [[Ubiquitous Language as a System Boundary]] · [[Authoritative Validation at Trust Boundaries]]

---
tags: [operations, reliability, observability]
description: Tie service objectives to executable response and regularly exercised recovery paths.
source: Adapted from MangaDock maturity roadmap and operations reports
---

# SLOs Runbooks and Recovery Drills

metric มีค่าเมื่อเชื่อมกับ objective, owner และการตอบสนองที่ทำได้จริง

- กำหนด SLI/SLO จากผลกระทบผู้ใช้ ไม่ใช่เพียง process uptime
- alert ต้องมี owner, threshold rationale และลิงก์ runbook
- runbook ระบุ diagnosis, containment, recovery, verification และ escalation
- ฝึก game day สำหรับ dependency outage, queue backlog, bad deploy และ restore
- หลังเหตุการณ์ ปรับทั้งระบบตรวจจับและขั้นตอนกู้คืน

Related: [[Degraded Modes Must Be Observable]] · [[Validated Blameless Postmortems]]

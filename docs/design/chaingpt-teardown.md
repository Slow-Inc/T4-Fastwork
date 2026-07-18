# ChainGPT Teardown — สูตร "ดูแพง/ว้าว" สำหรับ T4

> วันที่: 2026-07-19 · แหล่ง: `labs.chaingpt.org` + `www.chaingpt.org` (map + firecrawl scrape + Playwright runtime + source)
> ไฟล์อ้างอิง (gitignored): screenshots ที่ `.firecrawl/cg-teardown/shots/*.jpeg` · copy/structure ที่ `.firecrawl/cg-teardown/*.md` · branding tokens ที่ `.firecrawl/cg-*-branding.json`
> เอกสารนี้คือ **reference สำหรับ build** ไม่ใช่คำสั่งให้ clone — อ่านหัวข้อ §9 (ข้อจำกัด) ก่อนลงมือ

---

## 1. TL;DR — ทำได้ไหม + สูตรที่ทำให้ "แพง"

**ทำได้** — และ **T4 อยู่ใกล้กว่าที่คิด** เพราะ ChainGPT ทั้งสองเว็บสร้างบน **Webflow + GSAP** ไม่ได้มี magic อะไรที่ Next.js ทำไม่ได้ เรามี stack ที่แรงกว่าอยู่แล้ว (Next 16 + react-three-fiber + Lenis)

"ความแพง" ไม่ได้มาจาก design language แปลกใหม่ — มันมาจาก **execution 6 อย่างนี้ประกอบกัน**:

1. **ฟอนต์ display เฉพาะตัว + ทั้งเว็บเป็น mono** — จอใหญ่ยักษ์ (hero 198px!) tracking ติดลบ + ทุกอย่างที่เหลือเป็น monospace = ให้กลิ่น "lab/เทคนิค"
2. **grid + bordered cells ที่มองเห็น** — เส้น hairline + เครื่องหมาย registration (`×` `+` `⌐`) ตามมุม = เหมือน blueprint/spec sheet
3. **ScrambleText reveal บนหัวข้อ** — ตัวอักษรถอดรหัสตอน scroll เข้า (GSAP) = signature ที่จำได้
4. **3D จริง** — labs ใช้ Unicorn Studio (WebGL), www ใช้ **three.js + GLB model + HDR environment** (หุ่นยนต์สะท้อนแสงสมจริง)
5. **Lenis smooth scroll** + hover micro-transitions เยอะมาก (416 elements, 0.2–0.3s ease)
6. **ปุ่มเหลี่ยม (0–2px), shadow:none, accent สีเดียวแรงๆ** (labs=ส้ม, www=ม่วง)

T4 มี #1(บางส่วน), #5(Lenis+3D signature) แล้ว — ที่ขาดคือ #2 #3 #4(GLB) และการดัน scale/execution ให้สุด

---

## 2. สอง "โลก" ของ ChainGPT

ChainGPT มี **2 ภาษาภาพ** ที่คุณชอบทั้งคู่ — เลือกได้ว่า T4 เอาโลกไหนเป็นหลัก (แนะนำ **labs/light** เพราะใกล้ palette เดิม T4 + เหมาะ founder/CTO):

| มิติ | **labs.chaingpt.org** (light) ⭐ ใกล้ T4 | **www.chaingpt.org** (dark) |
|---|---|---|
| Ground | `#e4e4e4` เทาอ่อน **เย็น** (ไม่ใช่ครีมอุ่น) | `#0a090f` เกือบดำ |
| Text | `#0e0e0e` | `#efefe5` (floral white) |
| Accent | ส้ม `#ff7120` | ม่วง `#5529d3` / `#815ff7` |
| Display font | `LABSAmiga` (pixel/retro-futurist) | `VioletSans` (quirky grotesque) |
| Body/label font | `Roboto Mono` | `Roboto Mono` + Inter |
| 3D engine | **Unicorn Studio** (WebGL no-code) | **three.js 0.151** + GLB + HDR |
| Card motion | Swiper carousels | **Rive** (vector interactive) |
| อารมณ์ | technical lab, blueprint, playful chrome | cinematic, glow, premium dark |

> ⚠️ ทั้งสองเว็บ light ground = `#e4e4e4` (เทาเย็น) — **T4 ตอนนี้ใช้ `#f4f2ed` (ครีมอุ่น)** นี่คือ delta จริง ถ้าอยากได้ "labs feel" ต้องขยับ paper ให้เย็นลง (ดู §4)

---

## 3. Tech / Motion stack — และ map ลง T4

| ความสามารถ | ChainGPT ใช้ | T4 เทียบเท่า (มี/ต้องเพิ่ม) |
|---|---|---|
| Smooth scroll | Lenis 1.0–1.1 | **มีแล้ว** `smooth-scroll.tsx` |
| Scroll reveal | GSAP `ScrollTrigger` (`toggleActions: play`, ไม่ pin/scrub) | ปัจจุบันใช้ IntersectionObserver (`reveal-observer.tsx`) — อัปเกรดเป็น GSAP ScrollTrigger ได้เพื่อ choreography |
| Text reveal | GSAP **`ScrambleTextPlugin`** + `SplitText` บนหัวข้อ | **ต้องเพิ่ม** — GSAP (ฟรีทุก plugin ตั้งแต่ปลาย 2024) |
| Hero marquee | CSS `@keyframes textMoving 10s linear infinite` | CSS ล้วน ทำได้เลย |
| 3D hero | www: three.js + `GLTFLoader` + `RGBELoader`(HDR) + meshopt | **มี r3f + three** — ต้องเพิ่ม GLB model + HDR env (`@react-three/drei <Environment/>`) |
| 3D no-code | labs: Unicorn Studio | ทางเลือก — หรือทำเองด้วย r3f shader |
| Card animation | www: **Rive** (`.riv`) | ทางเลือก — Rive มี `@rive-app/react-canvas` |
| Carousel | labs: Swiper 11 | ต้องเพิ่ม (Swiper หรือ embla) สำหรับ portfolio/testimonial |
| Loading spinner | CSS `@keyframes spin .8s linear infinite` | trivial |
| Fonts | self-hosted `.woff2` (bespoke) | **@font-face data-URI / self-host** (ต้องหาฟอนต์ของเราเอง — §9) |

**assets จริงที่เจอ (ของเขา — ห้ามใช้ซ้ำ ใช้เป็นแนวทางเฉยๆ):**
`chainGPT_robo_COMP_2024.glb` (หุ่น 3D) + `Cannon_Exterior.hdr` (environment map) → ยืนยันว่า "3D Model ที่คุณอยากได้" = GLB + HDR lighting ผ่าน three.js

---

## 4. Design tokens

### labs (light) — ชุดที่แนะนำเป็นฐาน T4
```
--bg:        #e4e4e4   /* เทาเย็น (T4 ตอนนี้ #f4f2ed อุ่น) */
--ink:       #0e0e0e
--ink-60:    #636363
--grey:      #9e9e9e
--light:     #f6f6f6   /* card/surface */
--line-ink:  #1b1b1b   /* darklighter — เส้น/มุม marks */
--accent:    #ff7120   /* ส้ม (T4 มี #e8461b — ใกล้กัน, ของเขาสว่างกว่า) */
```

### www (dark) — สำหรับ dark variant อนาคต
```
--bg:      #0a090f
--text:    #efefe5
--divider: #353539
--primary: #5529d3  /  --primary-light: #815ff7
--error:   #ec4b44
```

### Type scale (labs — สังเกต "จอใหญ่ + tracking ติดลบ")
| role | size | font | tracking | line-height |
|---|---|---|---|---|
| Hero H1 | **198px** | LabsAmiga | normal | 0.89 (ติดกันมาก) |
| Page title (Portfolio) | 120px | LabsAmiga | **-0.06em** | 0.91 |
| Section H2 | 64–72px | LabsAmiga | **-0.06em** UPPERCASE | 0.91 |
| Label/kicker | 22px | Roboto Mono | normal | 1.4 |
| Body | 12–18px | Roboto Mono | normal | 1.4–1.87 |

> หัวใจ type: **display ใหญ่สุดๆ + tracking ติดลบ ~-0.06em + line-height <1** และ **ทุกอย่างที่ไม่ใช่ display = monospace**

### รูปทรง
- ปุ่ม: radius **0–6px** (เหลี่ยม), `box-shadow: none`
- cells: เส้น hairline `~rgba(0,0,0,0.1)`, มุมมี registration marks (`×`/`+`/`⌐`) + สี่เหลี่ยมส้มมุมหน้า
- spacing: section สูง 650–2000px, ปล่อย whitespace เยอะ, grid คอลัมน์ชัด

---

## 5. Signature devices (สิ่งที่ทำให้ "จำได้")

1. **Blueprint grid** — เส้น grid บางทั้งหน้า + `×`/`+`/`⌐` ตามมุม cell + สี่เหลี่ยมส้มมุมล่าง (ทำด้วย pseudo-element + background-image linear-gradient)
2. **Bordered spec-cells** — ทุก stat/feature อยู่ในกล่องมีขอบ พร้อม icon + label เล็ก mono + ค่าใหญ่
3. **ScrambleText heading** — หัวข้อถอดรหัสตอน scroll เข้า
4. **Hero marquee** — คำใหญ่วิ่งแนวนอน loop (`textMoving 10s linear`)
5. **display font ยักษ์ tracking ติดลบ** + mono ทุกที่
6. **3D object เดี่ยวเด่น** — หุ่น/เหรียญ/ชิป สะท้อนแสง HDR ลอยใน cell
7. **accent สีเดียว** ใช้เท่าที่จำเป็น (ปุ่ม, marks, 3D, FAQ squares)
8. **counter ตัวเลขใหญ่** — "Projects **16**", stats "55.7M / 2,000%"

---

## 6. Per-template teardown (เรียงตามความเกี่ยวกับ T4)

### 6.1 Portfolio index → **T4 `/projects`** (ตรงสุด)
`labs/portfolio` — ดู `shots/cg-labs-portfolio-full.jpeg`
- หัว "PORTFOLIO" ยักษ์ + label "Meet our recent incubations" + counter "Projects **16**" + featured card เดี่ยว (โลโก้ + 3D + stats + →)
- filter chips (All / Incubation / Acceleration / Investment) + ช่อง Search มุมขวา
- **grid การ์ด 2 คอลัมน์** — แต่ละใบ: category tag มุมซ้าย · โลโก้กลาง (grayscale) · **stats grid 2×2** (Funds Raised / Social Growth / ATH ROI / Partnerships) · ปุ่ม → มุมขวาใน cell แยก · ขอบ hairline + grid marks
- ปิดด้วย CTA "READY TO DISCUSS YOUR PROJECT?" + ปุ่มส้ม + newsletter + footer + wordmark ยักษ์จาง
→ **T4 map:** การ์ดโปรเจกต์เปลี่ยนเป็น spec-cell (category tag + โลโก้/thumbnail + metric 2×2 เช่น Year/Stack/Category/Role + →) + counter "Projects N" + filter chips (มีอยู่แล้ว)

### 6.2 Portfolio detail → **T4 `/projects/[slug]`** (ตรงสุด)
`labs/portfolio/atlas` — ดู `shots/cg-labs-portfolio-atlas-full.jpeg`
- "Back to list" + ชื่อโปรเจกต์ยักษ์ (display) + โลโก้+ชื่อมุมขวา + category tag + ปี
- description สั้น + links (VISIT WEBSITE ↗ / TWITTER ↗)
- **hero media ซ้าย** (วิดีโอ/ภาพ + PLAY) + **spec panel ขวา**: VERTICAL/FOUNDED/YEAR + toggle "Before / Now" + ตาราง metric cells (icon + label + ค่า)
- body paragraph + **testimonial card** (รูป + ชื่อ + role + quote) มี corner marks `⌐`
- "NEXT PROJECT →" + CTA + newsletter + footer
→ **T4 map:** หน้า project detail = display title ยักษ์ + spec panel (Year/Client/Stack/Role/Links) + media + testimonial + "โปรเจกต์ถัดไป →"

### 6.3 Home → **T4 `/`**
`labs` (light) ดู `shots/cg-labs-home-full.jpeg` · `www` (dark) ดู `shots/cg-www-home-full.jpeg`
โครง labs home บนลงล่าง:
1. Nav บาง full-width (โลโก้ · เมนูกลาง · ปุ่ม accent ขวา) + grid
2. **Hero** — display ยักษ์ (marquee) + kicker ส้มเล็ก + subhead + ปุ่ม + 3D object ใน cell ขวา + "OUR PARTNERS"
3. แถวโลโก้พาร์ทเนอร์ (grayscale ใน bordered cells)
4. 2-col + **3D กลาง** (หุ่นในหลอดแก้ว / เหรียญส้ม) + feature cards
5. "Our Incubations" — counter + stats table (grid หนา) + carousel
6. Media Presence + Testimonials (carousel)
7. Team grid
8. FAQ accordion (มี square ส้มขวา)
9. Blog cards → newsletter → footer + wordmark ยักษ์
→ **T4 map:** hero display ยักษ์ + 3D signature (มีแล้ว, ดันให้เด่นขึ้น) + partner/tech strip + services spec-cells + stats counter + case-study carousel + testimonials + FAQ + blog

### 6.4 Product page → **T4 service pages** (dark world)
`www/web3-chatbot` — ดู `shots/cg-www-web3-chatbot-full.jpeg`
- hero: display + 3D chip เรืองแสง + spec row · "Why Choose" 2×2 · "Core Features" สลับแถว + 3D/Rive · comparison table · gradient-glow CTA · FAQ · footer มี chat terminal
→ **T4 map:** ถ้าทำ service detail แนว dark → hero + 3D + feature rows + comparison + FAQ

> **template ที่เหลือ** (labs: apply/residency · www: pricing/case-studies/crypto-ai-hub) ใช้ design system เดียวกันซ้ำ — มี scrape ครบที่ `.firecrawl/cg-teardown/*.md` ถ้าต้องการ screenshot เพิ่มบอกได้

---

## 7. Motion recipe → วิธีทำใน T4 (Next 16 + r3f)

| effect | วิธีทำใน T4 |
|---|---|
| Smooth scroll | มี `smooth-scroll.tsx` (Lenis) แล้ว — ขยายให้ครอบทุกหน้า ไม่ใช่แค่ home |
| Scroll reveal | GSAP `ScrollTrigger` `{toggleActions:'play none none none'}` บน section (แทน/เสริม IntersectionObserver) — **ต้องกันจอเปล่าตอน headless/tab ซ่อน** (reveal ต้อง enhance state ที่มองเห็นอยู่แล้ว) |
| Scramble heading | `import {ScrambleTextPlugin, ScrollTrigger} from 'gsap/all'` → tween `scrambleText` ตอน enter · reduced-motion = ข้าม |
| Hero marquee | CSS `@keyframes` translateX `-50%` `10s linear infinite`, ข้อความซ้ำ 2 ชุด |
| 3D signature | มี `hero-scene.tsx` (r3f) แล้ว — อัปเกรด: โหลด **GLB** (`useGLTF`) + **HDR** (`<Environment files=.../>` จาก drei) ให้สะท้อนแสงแบบ www · SSR off (มีแล้ว) · WebGL→fallback (มีแล้ว) · reduced-motion static |
| Card interactive | ทางเลือก Rive (`@rive-app/react-canvas`) หรือ hover-transform ธรรมดา |
| Carousel | Swiper / embla สำหรับ projects/testimonials |
| Hover polish | transition `transform/opacity/filter 0.2–0.3s ease` ทั่วทั้งการ์ด/ปุ่ม |

**ลำดับที่ให้ผลต่อ "ว้าว" มากสุดต่อแรง (impact/effort):**
1. 🥇 blueprint grid + bordered spec-cells (CSS ล้วน, ผลสูง)
2. 🥇 ScrambleText heading reveal (JS เล็ก, signature ชัด)
3. 🥈 ดัน display scale + tracking ติดลบ + hero marquee
4. 🥈 อัป 3D hero เป็น GLB+HDR (ต้องมีไฟล์ GLB ก่อน — parked)
5. 🥉 carousels + Rive cards

### 7.1 Interaction ที่สังเกตจากของจริง (ขับ browser จริง ไม่ใช่เดา)
จับด้วย Playwright (ขยับเมาส์จริง + จับภาพหลายตำแหน่ง) — ยืนยันแล้ว:
- **hero 3D follow-cursor** — ทั้ง www (หุ่นหันหน้า + ตา visor เรืองแสง) และ labs (แขนกล/เครื่องจักรหมุน) หันตามตำแหน่งเมาส์แบบ real-time
- **⭐ Hero = pinned scroll-scrubbed 3D timeline + cursor-follow ผสมกัน** (ยืนยันจาก screen-recording ของ dev, www home 0:06–0:30):
  - **preloader:** chatbot UI แว่บ → จอดำ → **หน้าหุ่น (ตา 2 จุด) + "LOADING"** → reveal hero
  - **เฟส 1 (กล้องไกล, เต็มตัว):** เลื่อนเมาส์ = **หมุนทั้ง model** (yaw ทั้ง group) + เปิด mega-menu ได้
  - **⭐ จุดเปลี่ยนโหมด:** scroll → camera **dolly ซูมเข้า close-up** (head/หน้าอก)
  - **เฟส 2 (close-up):** เลื่อนเมาส์ = **หันแค่หัว/คอ** ไปหา cursor (ลำตัวออกนอกเฟรม) = "มีชีวิต"
  - **ปล่อย:** scroll ต่อ → หลุด hero เข้า section ถัดไป
  → คือ ScrollTrigger `pin + scrub` ขับ timeline (dolly กล้อง + pose) **ซ้อน**กับ pointer-follow ที่สลับ target (ทั้ง group ↔ head bone) ตามระยะกล้อง
- **hero text = marquee** วิ่งแนวนอน loop
- **carousel วิ่งเอง** (award badges: Product Hunt/Binance) + ลากได้ (Swiper แต่ `grabCursor:false` → ใช้ native cursor)
- **side scroll-rail** (www) — จุด indicator แนวตั้ง + "INTRO/MENU" ขวามือ บอกตำแหน่ง scroll
- **ไม่พบ custom-cursor DOM** ทั้ง 2 เว็บ (สแกนทุก depth) → cursor เป็น native; "การเปลี่ยนโหมด" ที่รู้สึกคือ **พฤติกรรม 3D เปลี่ยน (A→B)** ไม่ใช่ตัว cursor เปลี่ยนรูป

**วิธีทำใน T4 (react-three-fiber):**
```
// โหมด A — หมุนทั้ง group ตาม pointer
useFrame((state)=>{ group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.5, 0.06); })
// โหมด B — หันเฉพาะ head bone ด้วย quaternion ไปหา target ที่ unproject จาก pointer
head.current.lookAt(pointerWorldTarget)  // slerp เพื่อความนุ่ม
// สลับ A/B ด้วย section ที่อยู่ใน view (IntersectionObserver / ScrollTrigger onEnter → setMode)
```
โหมด B ต้องมี GLB ที่แยก **head/neck bone** ออกมา (rigged) — เป็นเหตุผลอีกข้อว่าทำไม **bespoke GLB (parked)** ถึงสำคัญ

---

## 8. แผน map ลง T4 (ต่อหน้า)

| หน้า T4 | เอา template ไหน | build อะไร | เรามีแล้ว | effort |
|---|---|---|---|---|
| `/` home | labs home | display scale↑, blueprint grid, scramble hero, 3D↑, stats counter, spec-cells | 3D hero, Lenis, reveal | M–L |
| `/projects` | labs portfolio | การ์ด→spec-cell (tag+logo+metric 2×2+→), counter, filter | filter chips | M |
| `/projects/[slug]` | labs portfolio detail | display title, spec panel, media, testimonial, next-project | โครงหน้า | M |
| service/about | labs sections / www product | spec-cells, feature rows | — | S–M |
| ทั้งเว็บ | ทั้งคู่ | ฟอนต์ display+mono, tokens เย็นลง, ปุ่มเหลี่ยม, grid marks | palette ใกล้แล้ว | S (tokens) |

---

## 9. ข้อจำกัด / ตรงๆ (อ่านก่อน build)

1. **ฟอนต์เป็น IP ของเขา** — `LABSAmiga` / `VioletSans` เป็นฟอนต์เฉพาะ/มีลิขสิทธิ์ **ห้ามดึงมาใช้** T4 ต้องเลือกฟอนต์ของเราเอง (parked item): display เฉพาะตัว + mono (mono ฟรีมีเยอะ: Roboto/JetBrains/IBM Plex Mono) "ความแพง" 60% มาจากฟอนต์ display — คุ้มที่จะลงทุนซื้อ/หา 1 ตัว
2. **GLB + HDR เป็นของเขา** — เราต้องทำ/หา model เอง (parked: bespoke robot/persona GLB) HDR ใช้ free HDRI ได้ (polyhaven, CC0)
3. **ไม่ใช่ pixel clone** — T4 ขายงานดีไซน์ ถ้า live เป็น clone จะเสีย credibility + content คนละแบบ เป้า = "แพง/ว้าวเท่าเขา แต่เป็น T4"
4. **Webflow ≠ Next** — เขา build บน Webflow (jQuery + GSAP) เราทำใน Next/React ได้ผลเดียวกันแต่ต้องเขียน component เอง (ดีกว่าเพราะคุมได้เต็ม)
5. **reveal-on-scroll กับจอเปล่า** — ScrollTrigger/observer reveal ต้อง enhance ของที่ render อยู่แล้ว ไม่งั้น screenshot/headless/SSR = จอเปล่า (เจอมาแล้วใน T4)

---

## 10. Reference files
- Screenshots (full-page): `.firecrawl/cg-teardown/shots/cg-{labs-home,www-home,labs-portfolio,labs-portfolio-atlas,www-web3-chatbot}-full.jpeg`
- Copy/structure scrape (10 templates): `.firecrawl/cg-teardown/*.md`
- Branding token dumps: `.firecrawl/cg-labs-branding.json` · `.firecrawl/cg-www-branding.json`
- Site maps: `.firecrawl/cg-labs-map.json` (48 links) · `.firecrawl/cg-www-map.json` (1098 links)

เกี่ยวข้อง: memory `t4-home-design-direction` · ADR (ถ้าตัดสิน design language → เขียน ADR ใหม่)

---

## 11. www.chaingpt.org — Full video walkthrough (frame-by-frame)
> จาก screen-recording ของ dev (179s, 1920×1080) — แตกเฟรมด้วย Chromium `<video>` seek → contact sheets ที่
> `.firecrawl/cg-teardown/shots/video-{overview,hero-dense,solutions,casestudies,ecosystem,tail}.png`
> **นี่คือ motion จริงทั้งเว็บ (dark world) ไม่ใช่ static** — เห็น cursor จริงในเฟรมด้วย

### Timeline + effect ต่อ section
| เวลา | Section | Effect / interaction | → T4 map |
|---|---|---|---|
| 0:00–0:12 | **Preloader** | chatbot UI แว่บ → จอดำ → **หน้าหุ่น (ตา 2 จุด) + "LOADING"** → reveal | intro gate สั้นๆ (optional; ระวัง perf/CLS) |
| 0:12–0:30 | **Hero** | ⭐ **pinned scroll-scrub 3D robot**: เฟส1 เต็มตัว หมุนทั้ง model ตามเมาส์ + เปิด mega-menu → **dolly ซูมเข้า** → เฟส2 close-up **หันแค่หัว** ตามเมาส์ → ปล่อย | 3D hero signature (มี r3f) + GLB rigged + pin/scrub |
| 0:32–0:56 | **Our Solutions** | ⭐ **sticky 3D ที่ swap model ต่อ solution** ตอน scroll (cube ดำ + iridescent + ธาตุเรืองแสง: visor/chart/magnifier/AIVM cloud/rocket/shield) แถวสลับ ชื่อ↔3D↔bullets | service cards แบบ sticky-3D หรือ icon 3D ต่อบริการ |
| 0:56–1:12 | **Case Studies** | carousel แนวนอน **auto-scroll** — การ์ด: ภาพ glossy + "How X…" + คำอธิบาย | case-study/portfolio carousel |
| 1:12–2:06 | **Ecosystem node-graph** ⭐⭐ | **pinned scroll-scrub** ไล่ 4 layer (AI Application→$CGPT Token→AIVM Blockchain→Labs) — node = icon ในกล่องขอบมน เชื่อมเส้นโค้ง, **สว่างเรียงลำดับ** (active สี/อื่น grey), layer title ใหญ่เปลี่ยนตาม scroll | "how we work / tech-stack / service map" — signature ของ T4 ได้เลย |
| 2:06–2:19 | **Pricing** | "Our Pricing" (boxed) + toggle + **feature matrix** (column = tool, row = feature, ✓) + icon tools แถวบน | pricing/compare table (ถ้ามี) |
| 2:19–2:25 | **$CGPT token** | **3D coin หมุน** (โลโก้ iridescent ในวงแหวนดำ) + tokenomics bullets | ไม่ค่อย map (crypto-specific) — แต่เทคนิค coin-spin ใช้กับ 3D badge ได้ |
| 2:25–2:32 | **Partners / Blog** | partner logos แถว (Binance/Bitget/Uniswap/HTX…) + media/video cards + "blog vlog spaces" | client logos strip + blog cards |
| 2:32–2:40 | **Team / FAQ** | advisor **b/w portraits ในกรอบขอบ** + FAQ accordion (เปิด/ปิด) | team grid + FAQ accordion (T4 มี FAQ) |
| 2:42–2:47 | **AI Revolution** | boxed title + **tweet/social-proof cards** + press logos (Yahoo/Bitcoin.com…) | testimonials + press/social proof |
| 2:49–2:58 | **Footer** | หุ่น 3D (visor cube) กลาง + social columns + stats (195K/45K/1M) + "Subscribe" + link columns | footer + 3D accent + newsletter |

### สรุป "wow" 12 อย่างของทั้งเว็บ (ทั้งหมดยืนยันจากวิดีโอ)
preloader หุ่น · **pinned scroll-scrub 3D hero (2 โหมด follow)** · **sticky 3D swap ต่อ solution** · auto carousel · **pinned node-graph 4 layer** · pricing matrix · **3D coin spin** · partner marquee · b/w portraits ในกรอบ · FAQ accordion · social-proof tweet cards + press · footer 3D + stats

### เทคนิคหลักที่ทำซ้ำทั้งเว็บ (recipe)
- **ScrollTrigger `pin + scrub`** ขับ timeline ยาว (hero, node-graph) — เป็นตัวสร้าง "wow" หลัก
- **3D กลางจอที่ swap/morph ตาม scroll** (solutions, hero) — sticky canvas + เปลี่ยน model/pose
- **icon ในกล่องขอบมน + เส้นเชื่อม** เป็นภาษาเดียวทั้งเว็บ (node-graph, feature cards)
- **cursor-follow 3D** (ทั้ง group / head-only ตามระยะกล้อง)
- **iridescent/rainbow accent** บน 3D + glow subtle บนพื้นดำ #0a090f
- ทุกอย่าง reveal ด้วย ScrollTrigger + Lenis; hover transition 0.2–0.3s

> **หมายเหตุ dev:** โฟกัสที่คุณชอบคือ **3D + scroll-scrub interaction** — ตัวที่ทำได้จริงใน T4 (r3f + GSAP ScrollTrigger + Lenis) คือ hero 2-โหมด และ node-graph map ส่วน content เป็นของ T4 (agency/portfolio) ไม่ใช่ crypto

---

## 13. Complete 1fps coverage — ยืนยันครบทุกเฟรม (ไม่ข้าม)
ไล่ทั้ง 2 วิดีโอที่ ~1 เฟรม/วินาที (video1 179s / video2 210s) — contact sheets 1fps เก็บที่ `.firecrawl/cg-teardown/shots/`:
`v1-78,v1-102,v1-126,v1-151` (www ecosystem+tail) · `v2-66,v2-91,v2-116,v2-141,v2-165,v2-190` (labs portfolio→residency) + dense sheets ก่อนหน้า

**Device ที่ยืนยันเพิ่มจากการดูละเอียด:**
- ⭐ **orange full-bleed "wipe" เป็น section transition** (labs) — ไม่ใช่แค่ preloader; ใช้คั่นระหว่าง section (เช่น footer→portfolio) = signature transition (color-drench ชั่วขณะ)
- **node-graph = diagram สูงที่ scroll ผ่าน (ดู 2fps 1:13–2:08 v1-eco-*)** — animation ต่อ layer (เหมือนกันทุกชั้น AI Application / $CGPT Token / AIVM Blockchain / Labs & Launchpads):
  1. **node fade + scale เข้าทีละตัว (staggered)** ตอน cluster เข้า viewport
  2. **connector line ค่อยๆ วาด** ระหว่าง node (stroke-dashoffset)
  3. **hero-node กลางติดสีแบรนด์ + เรืองแสง** (CGPT coin=รุ้ง, AIVM cloud=น้ำเงิน-ม่วง, Labs=ส้ม) ส่วน node รอบเป็น outline เทา
  4. **layer-title pin ค้างซ้ายบน** ตลอดที่อยู่ใน cluster
  5. scroll ต่อ → cluster เก่าจาง/เลื่อนออก + ใหม่จาง/เลื่อนเข้า (title อัปเดต)
  → build ใน T4: GSAP ScrollTrigger (toggle-on-enter ต่อ node + scrub ต่อ cluster) + SVG/DOM node + `stroke-dashoffset` วาดเส้น
- **Solutions = 1 sticky 3D หมุน idle ตลอด + morph สลับร่างตาม scroll ผ่าน 9 บริการ** (ดู 3fps 0:35–0:50 `v1-sol-*`): chatbot visor → chip → แว่นขยาย(audit) → NFT → **AIVM cloud หลากสี** → กราฟ(trading) → ring(API) → VR/launch → โล่(CryptoGuard); ซ้ายเป็น **text ticker แนวตั้ง** (ชื่อปัจจุบัน bold / ก่อนจางขึ้น / ถัดไปจางล่าง) sync 3D = object เดียวเล่าครบทั้ง product line
- **$CGPT coin 3D หมุนตาม scroll** (scroll-scrubbed rotation) + tokenomics bullets ทยอยเข้า
- **ScrambleText บน section title** — จับได้กลางคำจริง (labs testimonials 1:23 "n SK S K" → "TESTIMONIALS")
- **LABS wordmark ยักษ์ footer** เลื่อน parallax ตอน scroll
- **carousel auto-advance** (portfolio/testimonial/team/case-study/award badges) + progress indicator ส้ม
- **Pricing feature-matrix** 8 tools (columns) × features (rows) + toggle
- **hover-reveal logo grid** ("Our Alumni / Have Raised From" — tile จาง→ hover เผยโลโก้)

> **สรุป:** ดูครบทุกเฟรมแล้ว ไม่มี effect ใหม่ที่ยังไม่ได้บันทึก — recipe ทั้งหมดอยู่ใน §7, §7.1, §11, §12 · ส่วนที่เหลือในวิดีโอเป็น dev เลื่อนกลับไป-มา (section ซ้ำ)

---

## 12. labs.chaingpt.org — Full video walkthrough (light world)
> จาก screen-recording ที่ 2 ของ dev (210s, 1920×1080) — contact sheets: `.firecrawl/cg-teardown/shots/video2-{overview,labs-hero,labs-residency}.png`
> **นี่คือ light world (T4-relevant ที่สุด) ในแบบ motion** ครอบ home + portfolio + residency

### Timeline
| เวลา | Section | Effect | → T4 |
|---|---|---|---|
| 0:00–0:08 | **Preloader** ⭐ | **counter pixel นับ 0→100 บนพื้นส้มเต็มจอ** (LabsAmiga digits) | intro counter (CountUp มีอยู่แล้วใน T4!) |
| 0:09–0:32 | **Hero** | **"BACKING TOMORROW" marquee** วิ่ง loop + **หุ่น chrome+visor ส้ม ประกอบตัว/หมุน** ตาม scroll/เมาส์ + partner logos (active highlight) + 3D flower ในกรอบดำ | hero marquee + 3D signature |
| 0:31–1:05 | **Beyond Capital / Incubation** ⭐⭐ | ดู callout ด้านล่าง (หลอดทดลอง scroll-scrub) | signature "storytelling 3D" |
| 1:06–1:20 | **Portfolio** | "PORTFOLIO" ยักษ์ + **node-graph connector รอบหุ่น** + counter "16" + stat cards (2×2) | /projects (blueprint จาก §6.1) |
| 1:20–1:41 | Media / Testimonials / Team | carousels + b/w & color portraits | testimonials + team |
| 1:48–2:09 | FAQ / Latest News / Newsletter | accordion (orange markers) + blog cards + subscribe | FAQ + blog + newsletter |
| 2:16–2:23 | Footer | **wordmark "LABS" ยักษ์จาง** | footer big wordmark |
| 2:57–3:05 | **WE BACK BUILDERS** ⭐⭐ | **ส้มเต็มจอ (color drench)** + ภาพ editorial คน CRT/VR headset โทนส้ม + pixel text | bold CTA/section เดียวเด่น (drench) |
| 3:05–3:12 | **Residency** ⭐ | **3D keycaps "build"** (คีย์บอร์ด 3D ส้ม-ขาว) + "BY THE NUMBERS" counter ส้ม + "WHAT YOU GET" การ์ด 3D + เส้นเชื่อม | playful 3D + stat counters |
| 3:12–3:30 | Alumni / Partners / FAQ | logo grid (hover reveal) + accordion | client logos + FAQ |

### ⭐⭐⭐ Hero choreography (0:03–0:25) — dev บอกว่าว้าวที่สุด
beat-by-beat (จาก `video2-hero-superdense.png`):
1. **Preloader (3.0–7.6s):** **ส้มเต็มจอ (color drench)** + **counter pixel 0→100** (LabsAmiga ยักษ์) + **progress bar เขียวมุมขวาบน**
2. **Reveal (8.5s):** ส้ม **wipe/เปิดม่าน** เผย hero (light) หุ่นพร้อมกลางฉาก — จังหวะเปิดตัวดราม่า
3. **Hero loop (9s+):**
   - **"BACKING TOMORROW" marquee** วิ่ง loop ต่อเนื่อง (LabsAmiga)
   - ⭐ **หุ่น chrome "แปลงร่าง" วนตลอด (idle transformation)** — แขนกล → พับเป็นหัว cube + **visor ส้มเรืองแสง** → **เปิดอกเผย core ส้ม (reactor glow)** → วนกลับ = ไม่ใช่แค่หมุน แต่ animate ทั้งตัว + cursor/scroll ผสม

**Element inventory เต็ม (4fps 0:08–0:25, `v2-h4-*`) — kinetic typographic hero:**
- **BG marquee** "BACKING TOMORROW" (LabsAmiga ~198px, ดำ #1b1b1b บน #e4e4e4) เลื่อนซ้าย loop ~10s **หลัง 3D**
- **3D robot กลาง** chrome + transform loop (เปิดอก core ส้ม → แขนยืด → หัว cube visor) + หมุน — ทับกลาง marquee
- **nav บน:** โลโก้ ChainGPT LABS + เมนู (Our Programs/Portfolio/Media/Reviews/Team/FAQ/Residency/Blog) + ปุ่มส้ม APPLY NOW
- **ซ้ายกลาง:** subhead mono ("Backing the very best web3 builders — transforming visionary ideas into real-world growth.") + ปุ่มส้ม APPLY FOR INCUBATION
- **ขวา:** กล่องดำ + 3D flower/jack ขาว + "OUR PARTNERS" ‹›
- **ล่าง:** partner strip grayscale (Chainlink · TRON · BNB · OKX, active highlight)
- **ทั้งเฟรม:** blueprint grid + สี่เหลี่ยมส้ม 4 มุม + registration marks (`×`) + version labels ขอบ
- **8.0–8.5s:** preloader ส้ม wipe แนวทแยง (counter 100 → เผย hero)

**วิธี build ใน T4 (r3f + GSAP):**
```
// preloader: ส้มเต็มจอ + counter (T4 มี CountUpObserver) + progress → wipe reveal (clip-path / translateY) ครั้งเดียวต่อ session (sessionStorage กัน replay)
// marquee: CSS @keyframes translateX -50% linear infinite (ข้อความซ้ำ 2 ชุด)
// robot: GLB ที่มี "animation clip" (แปลงร่าง) → useAnimations(gltf) เล่น loop + rotation lerp ตาม pointer + reduced-motion = หยุด clip แสดง pose นิ่ง
```
> ⚠️ ตัวแพงคือ **GLB ที่ rig + มี transformation clip** (ไม่ใช่ mesh นิ่ง) — parked item ที่สำคัญสุด; เริ่มด้วย placeholder (icosahedron หมุน + emissive core) ไปก่อนได้ แล้วสลับ GLB ทีหลัง

### ⭐⭐ หลอดทดลอง (incubation chamber) — scroll interaction ที่เด่นสุดของ labs
**3D sticky "หลอดทดลอง" ที่ของข้างในเปลี่ยน + ขยับตาม scroll** (pinned + scrub) = 3D ที่ **เล่าเรื่อง** ไม่ใช่แค่สวย:
- **หุ่น visor ส้มในหลอดแก้ว** — scroll → หุ่นเลื่อน/เรืองแสงเหมือน "ฟักตัว" + คำ "INCUBATION" สไลด์เข้า (metaphor: incubation program)
- scroll ต่อ → **สลับเป็นเหรียญส้ม 3D** หมุน/ลอย (= capital/funding)
- scroll ต่อ → ปล่อยออกจากหลอด เข้า **PORTFOLIO + node-graph รอบหุ่น** + counter
- **narrative:** บ่ม builder → ให้ทุน → ออกสู่ portfolio (3D เดียวเล่าทั้ง value prop)
→ **T4 map:** เอา signature object ของ T4 (เช่น รูปทรง abstract/หุ่น) ใส่ใน "chamber/frame" แล้ว scroll-scrub ให้มัน morph/ประกอบ เล่า process ของ T4 (เช่น brief → build → ship) — **นี่คือวิธีทำ 3D ให้ "แพง+จำได้+มีความหมาย" ที่ควรลอก concept (ไม่ใช่ลอก asset)**

### ของใหม่จาก labs ที่ static ไม่เห็น (เก็บเป็น idea)
1. ⭐ **counter preloader 0→100 บนส้ม** (pixel font) — T4 มี `CountUpObserver` อยู่แล้ว ทำได้ทันที
2. ⭐⭐ **color-drench section (ส้มเต็มจอ) + ภาพ editorial** — เบรกจังหวะ light-grey ด้วยบล็อกสีจัด 1 จุด = จำได้/ไม่น่าเบื่อ (แก้ปัญหา "เรียบจนจำไม่ได้" ของ T4 ได้ตรงจุด)
3. ⭐ **3D keycaps / playful 3D props** — 3D ไม่ต้องเป็นหุ่นเสมอ, ของเล่นเชิงสัญลักษณ์ก็ได้
4. **portfolio node-graph** — labs ก็ใช้ node-graph (ยืนยันว่าเป็นภาษากลางทั้ง brand)

### ⚖️ Light (labs) vs Dark (www) — สำหรับ T4
| | **Light / labs** ⭐ แนะนำ | Dark / www |
|---|---|---|
| อารมณ์ | technical-lab, editorial, playful, "แพง-สะอาด" | cinematic, premium-crypto, SaaS |
| ใกล้ T4 ปัจจุบัน | **มาก** (palette warm-grey + ส้มใกล้กันอยู่แล้ว) | ต้องเปลี่ยนทั้ง theme |
| เหมาะกับ | agency/portfolio, founder/CTO, งานดีไซน์ | product/dApp, token |
| 3D | chrome/orange + editorial photo + keycaps | robot GLB + HDR reflection จัดเต็ม |
| color-drench | **ส้มเต็มจอเป็น accent จุดเด่น** | ทั้งเว็บดำ |

**คำแนะนำ:** T4 เอา **light/labs เป็นหลัก** (ใกล้ตัว + เหมาะ agency) แล้วยืม move เด่นของ www มา 1–2 อย่าง (pinned scroll-scrub 3D hero, node-graph map) + ทำ **1 color-drench section แบบ WE BACK BUILDERS** เป็นตัวจำ — เก็บ dark ไว้เป็น variant/หน้า chat หรือ service ในอนาคต

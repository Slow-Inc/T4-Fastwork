# Team profiles — per-person pages, real project history, tech logos, viewable certificates

Date: 2026-07-13
Status: Approved (design)
Scope: `nextjs/` only (frontend). No backend/CMS changes.

## Goal

Redesign the `/about` "ทีมที่ลงมือสร้างจริง" (Team) section and add a **dedicated page per team
member** (`/team/[slug]`) that shows: the person's real role/education, their skill + tech-stack
chips (now with **SVG brand logos**), their **real project history** (sourced from actual GitHub
repos), and their **certificates as viewable images** (click to open a lightbox; download the
original PDF/PNG).

Hard constraint carried from prior work: **nothing fabricated.** Every project, tech, and
certificate is a real, sourced fact. Members without data for a given block simply omit that block.

## Sources of truth (already gathered)

- **Roster / roles / education / skills / stack**: existing `team` array in `content/site.ts`
  (from github.com/Slow-Inc README + per-person confirmation). Unchanged.
- **Project history**: real repos audited via `gh repo view` (name, description, primary language,
  languages, pushedAt). Personal repos attributed to their owner; org `Slow-Inc` repos attributed
  via `gh api repos/<r>/contributors`.
- **Certificates**: real files in `C:\Users\xenod\Downloads\Certificate\{xeno,thanathorn,cable}`.

### Project attribution (decided)

- Personal repos → that person's page.
  - **xenodev**: narze, resume_web, facedetection, Hype-Macro_Store, Home-IoT-System, orangecat, xeno-skills
  - **paradise** (CableMoMo2027): TeachThrough, PopcornPlus, MoMo.Ecom, NextSeatProject, Todo_Dashboard.vue, Galleria_app, Project_Flutter
  - **thanathornz** (ThanathornZDev): LINE_OA_BOT, Java-GUI-Read-Write-Binary-Data-File
  - **akkanop-x**: get-statement-kbiz
  - **slowgers**, **ini4**: no personal dev repos → no personal-projects block.
- Org `Slow-Inc` repos are **team projects**, shown together in one shared "Team projects" block
  (rendered once on `/about`, and linked from member pages). Each carries its real contributor
  handles (MangaDock: xenodeve, akkanop-x · Website_Prototype01_Frontend: xenodeve, CableMoMo2027 ·
  Website_Prototype01_Backend: xenodeve · planet_management: xenodeve). This satisfies "แสดงที่
  เดียวกันให้หมดในส่วนผลงานแต่จะแยกตาม Repo แต่ละคน": all team repos in one place, each labeled with
  whose repo/contribution it is.

## Data model (`content/site.ts`)

Extend `TeamMember`:

```ts
export interface TeamProject {
  name: string;
  description: string;   // real repo description (Thai/English as-is); '' if repo has none
  url: string;
  tech: string[];        // languages/stack from the repo
  year: number;          // from pushedAt
}
export interface TeamCertificateAsset {
  webp: string;          // /certificates/<slug>/<id>.webp  (display image, always present)
  pdf?: string;          // original PDF download, if available
  png?: string;          // original PNG/JPG download, if available
}
export interface TeamCertificate {
  issuer: string;
  title: string;
  asset?: TeamCertificateAsset;   // present when we have the real file on disk
}
export interface TeamMember {
  // ...existing fields...
  slug: string;                   // url-safe: thanathornz, ini4, paradise, ...
  projects?: TeamProject[];       // personal repos
}
export const teamProjects: TeamProject[] = [ /* shared Slow-Inc org repos */ ];
```

Slugs: `slowgers`, `ini4`, `xenodev`, `akkanop-x`, `thanathornz`, `paradise`.

Pure helper `teamSlug(handle)` (lowercase, strip leading `_`, strip non-alphanumeric except `-`) —
unit-tested; the `slug` values above are what it must produce for each real handle.

## Certificate asset pipeline (one-off prep script, committed output)

Script `scripts/build-cert-assets.mjs` (dev-time, run manually; **its output images are committed**
to `public/certificates/`, the script is not part of the Next build):

1. Copy originals from `Downloads\Certificate\{xeno,thanathorn,cable}` into
   `public/certificates/<slug>/` keeping PDF and PNG/JPG where present.
2. For each certificate, produce a `<id>.webp` display image:
   - PNG/JPG source → `sharp(input).webp()` (xeno's 4, cable's 1).
   - PDF-only source (thanathorn's 5) → render page 1 with `pdfjs-dist` + `@napi-rs/canvas` to a
     raster buffer, then `sharp(buf).webp()`.
3. Downloads offered on the page: PDF and/or PNG, whichever exist.

Dev deps to add: `pdfjs-dist`, `@napi-rs/canvas` (both prebuilt, cross-platform). `sharp` already present.

**Thanathorn's 5 PDFs must be opened/read to map each file → the correct certificate** (Cyber
Security Awareness / AI Governance & Ethics / Entrepreneurial Mindset / GenAI for Application
Developers / English B1.2) before wiring `asset`. No guessing.

## Tech-stack logos

- Vendor SVGs from **simple-icons** (CC0) into `public/tech/<slug>.svg`, only the icons actually used.
- Pure helper `techLogo(name): string | null` maps a stack/skill label → `/tech/<slug>.svg` or `null`.
  - Handles combined labels (e.g. "Cloudflare (CDN, DNS, Tunnel)" → cloudflare icon).
  - `null` for items with no real brand mark (Radmin, DNS, DHCP, Nmap, Burp Suite, Kali Linux,
    VMware, Runpod, "Public Cloud (AWS, Azure, GCP)", DaVinci Resolve if not in set, etc.).
- Rendering: logo present → `<img>` + label; `null` → **text chip with a short mono initialism**
  (fallback), visually consistent with logo chips.
- Unit-tested: known names resolve to expected files; unknown names return `null`.

## Layout (per Requirement §14.4 — each section a distinct structure)

### `/team/[slug]` member page
Distinct from the card grid. Blocks separated by hairline rules, mono index, per-block reveal:
1. **Hero band** — index `01`, handle, role, education line, GitHub link (asymmetric, not centered).
2. **Skills** — primary skill chips.
3. **Tech stack** — grid of logo chips (SVG) + text-chip fallbacks.
4. **Projects** — real repos as an index-numbered "list in column" (`04 — name`, description, tech,
   year, external link). Omitted for members with no repos.
5. **Certificates** — gallery; each card shows the WebP, click → lightbox (zoom), with PDF/PNG
   download links. Omitted for members with no certs.
6. Back link to `/about#team`.

`generateStaticParams` from `team`; `generateMetadata` per member; 404 for unknown slug.

### `/about` team section redesign
Replace the 6 identical cards (anti-pattern §14.8 "grid การ์ด 3 ใบหน้าตาเหมือนกัน") with a
**directory list**: index `01–06`, handle, role, condensed skills, each row linking to the member
page — a genuinely different structure from the other `/about` sections. Plus the shared **Team
projects** block (org repos with contributor labels).

## Testing (TDD)

- Unit (`bun test`): `teamSlug()` for every real handle; `techLogo()` known→file / unknown→null;
  the presentational views render member handle/role/projects/cert images; the `/about` directory
  renders 6 linked rows.
- E2E (`bun run e2e`, mandatory): each `/team/[slug]` has a visible `<h1>`, shows real project
  names, a cert image is clickable and opens the lightbox, no navbar/breadcrumb overlap, no console/
  hydration errors, TH/EN switch works. `/about` directory rows navigate to the right member page.

## Out of scope

Admin/CMS management of team members; backend changes; i18n of raw repo descriptions (shown as-is).

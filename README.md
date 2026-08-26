# Resume Tailor

A resume builder that scores your experience against a job description with
deterministic keyword logic — not an opaque model — then lets you curate the
result and export a pixel-identical PDF or DOCX, plus a templated cover letter.

Fill in a master profile once (contact info, work experience, projects,
volunteer work, skills, education, certifications), paste a job description,
and the app extracts its requirements, scores every profile item against
them, auto-selects and ranks the most relevant content, and renders it
through an ATS-safe single-column template.

## Structure

npm workspaces monorepo:

- `shared/` — TypeScript types, the curated skill taxonomy, and the pure,
  unit-tested scoring/parsing engines (relevance scoring, resume-quality
  scanning, skill validation, cover-letter templating, JD requirement
  extraction helpers) — imported by both other workspaces.
- `backend/` — Express + TypeScript + Mongoose API: profile CRUD, job
  description ingestion, relevance/selection endpoints, resume-version
  persistence, PDF export (Puppeteer) and DOCX export (`docx`), cover letter
  generation, and best-effort resume-file import (PDF/DOCX → structured
  draft via `pdf-parse` / `mammoth`).
- `frontend/` — React + TypeScript + Vite: the Profile Editor (with a live
  "Resume Health" and "Skill Validation" panel) and the Tailor Resume flow
  (JD paste → live ATS score preview → drag-to-reorder selection → resume
  and cover-letter preview → export), plus a standalone `/print` route that
  Puppeteer renders for export so the PDF always matches the live preview.

## Running locally

Requires a local MongoDB instance (default `mongodb://localhost:27017/resumebuilder`).

```bash
npm install                      # installs all three workspaces

npm run dev:backend              # http://localhost:4000
npm run dev:frontend             # http://localhost:5173 (proxies /api to :4000)
```

Copy `backend/.env.example` to `backend/.env` to override `PORT`,
`MONGODB_URI`, or `FRONTEND_URL` (used by the PDF/DOCX export routes to know
where to render the print view from).

## Tests

```bash
npm run test --workspace=backend
```

Backend/shared logic (JD extraction, relevance scoring, selection, resume
scanning, skill validation, cover letter generation, resume parsing) is
covered by Vitest — no UI test suite; UI changes are verified manually
against a running dev server.

## Design principles

- **No black-box scoring.** Every score (ATS fit, resume health, skill
  validation) is computed by plain, inspectable rules — regex and a curated
  skill taxonomy — not an LLM. The one place "AI" is named in the UI (cover
  letter generation) is explicitly templated from data the app already
  computed, not freeform generation.
- **The master profile is the source of truth.** Tailoring a resume to a job
  never mutates it — selections and exports are derived, disposable views.
- **Preview/export parity by construction.** The PDF/DOCX export renders the
  exact same `TailoredResume` data and (for PDF) the exact same React
  template component as the on-screen preview, so there's no separate layout
  engine to drift out of sync.

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

## AI provider

The editor's four AI features — AI Review, LinkedIn Optimizer, Question
Generator, and AI Cover Letter — all call one internal interface
(`backend/src/services/llm/features.ts`), and which model actually answers
is chosen entirely by the `AI_PROVIDER` environment variable. No call site
anywhere in the app names a provider, so switching is a config change, never
a code change.

**Local development (default, zero cost):**

1. [Install Ollama](https://ollama.com/download).
2. Pull a model: `ollama pull llama3.1` (any Ollama model works — a smaller
   one like `llama3.1:8b` is fine for iterating on prompts, a larger one
   gives better output quality).
3. Make sure Ollama is running (`ollama serve`, or it's already running as a
   background service on most installs).
4. In `backend/.env`:
   ```
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1
   ```
   (`AI_PROVIDER=ollama` is the default even if unset — this is only needed
   if you're overriding the model or base URL.)
5. Run the backend as usual (`npm run dev:backend`). Every AI feature now
   calls your local model, at no cost.

If Ollama isn't running, calls fail with a specific error rather than a
generic crash: `Can't reach Ollama at http://localhost:11434 — is it
running?`. If the model isn't pulled, you get a similarly specific error
telling you to `ollama pull <model>`.

**Manual testing:** `GET /api/ai-debug` reports the active provider/model
without calling it; `GET /api/ai-debug/:feature` (`review-resume`,
`linkedin`, `interview-questions`, or `cover-letter`) runs that feature
end-to-end against a small fixed fixture and returns the provider, model,
latency, and result — useful for comparing output quality across providers
by just flipping `AI_PROVIDER` and re-running the same request. Dev-only,
not mounted when `NODE_ENV=production`.

**Going to production:** set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`
(and optionally `ANTHROPIC_MODEL`, default `claude-3-5-sonnet-20241022`).
That's the entire change — no code touches a provider name directly. If
`AI_PROVIDER=anthropic` is set without a key, the app fails fast with a
clear error at call time rather than silently falling back to Ollama or any
other provider.

`openai` and `gemini` are also selectable via `AI_PROVIDER` (adapters
already exist, using `OPENAI_API_KEY`/`GEMINI_API_KEY`) if you'd rather use
one of those instead of Anthropic.

See `backend/.env.example` for the full list of variables.

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

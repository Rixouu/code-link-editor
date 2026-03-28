# Code Link Editor

A **Next.js** app for **email and CRM teams** who need **consistent tracking** on outbound links: paste HTML, scan anchors, apply **saved presets** (UTMs, custom query params, optional **deep-link flags** like `$deep_link` / `$follow_redirect`), **validate** domains and required parameters, then copy **governed HTML** or **export a CSV**.

## How it works (two tabs)

1. **HTML workspace** — Paste or edit HTML in CodeMirror, **Scan HTML for links** to extract every `<a href>` in document order, and preview the governed output. Copy final HTML from here when you are done.

2. **Governance** — A **step-oriented** flow so the main task stays obvious:
   - Short **“How to use this tab”** intro with numbered steps and a shortcut back to the workspace if links are not loaded yet.
   - **Apply tracking rules** — Pick the active preset, read a plain-language **“what this preset does”** summary, then **Apply preset to all links** and **Download CSV**. A single **validation status** line reports pass/fail for the current preset.
   - **Review links** (collapsible) — Edit final URLs per row; **original href** is optional behind a checkbox to keep the table readable.
   - **Preset library** (collapsible) — Create, duplicate, edit, or delete presets. The **full preset form** only opens when you choose an action (not shown by default).
   - **Optional: plain-text URLs** (collapsible) — Heuristic list of `http(s)://` strings **outside** `<a>` tags for QA only.

Presets are stored in **`localStorage`** (this browser only). There is **no database**; add a backend when you need shared presets or audit history.

## Features

- **DOM-based link updates** — Uses `DOMParser` / ordered anchors so duplicate URLs and reordering do not break like naive `String.replace`.
- **Campaign presets** — Brand/channel labels, UTM fields, custom `key=value` lines (merge tags allowed), deep-link toggles, **allowed domains**, **required query keys**.
- **Validation** — Per-link checks against the active preset (domain allowlist, required params).
- **CSV export** — Link inventory with validation outcome for spreadsheets or handoff.
- **Design system** — Shared **CSS variables** (`--primary`, `--muted`, `--border`, …) in `globals.css`, utility classes (`app-shell`, `app-section`, `app-header`, …), and shadcn-style **Button** / **Input** / **Tabs** tokens in `tailwind.config.ts`.
- **API route** — `GET /api/fetch-code?url=…` for optional server fetch (not wired in the default UI; review SSRF risk before production use).

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| UI | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) patterns, [Radix UI](https://www.radix-ui.com/) primitives |
| Editor | [@uiw/react-codemirror](https://github.com/uiwjs/react-codemirror), `@codemirror/lang-html` |
| Icons | [lucide-react](https://lucide.dev/) |
| Lint | [ESLint 9](https://eslint.org/) flat config via `eslint-config-next` |

## Requirements

- **Node.js** 20.19+, 22.13+, or 24+ recommended.
- **npm** (or another client with equivalent commands).

## Getting started

```bash
git clone <repository-url>
cd code-link-editor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | Run ESLint (`eslint .`) |

## Project layout

```
src/
├── app/
│   ├── api/fetch-code/route.ts
│   ├── globals.css        # design tokens + app-* layout utilities
│   ├── layout.tsx
│   ├── page.tsx
├── components/
│   ├── campaign/
│   │   └── CampaignGovernancePanel.tsx
│   ├── LinkWizard.tsx     # tabs: workspace + governance
│   └── ui/
├── lib/
│   ├── campaign/          # presets, HTML anchors, apply/validate, CSV, unlinked-url scan
│   └── utils.ts
└── utils/linkUtils.ts     # legacy regex helpers (unused by main UI)
```

`next.config.mjs` sets `turbopack.root` to this package when other lockfiles exist higher in the filesystem.

## Deployment

Deploy on [Vercel](https://vercel.com/) or any Node host that supports Next.js. Run `npm run build` in CI.

## Security notes

- **`/api/fetch-code`** can trigger server-side `fetch` to arbitrary URLs—restrict, authenticate, or remove in production if unused.
- **`package.json`** includes an **`overrides`** entry for `dompurify` (Monaco transitive dependency).

## License

Add a `LICENSE` file if you publish terms; none is bundled by default.

---

Maintained by **Jonathan Rycx** — [LinkedIn](https://www.linkedin.com/in/jonathanrycx/).

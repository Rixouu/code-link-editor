# Code Link Editor

A small **Next.js** app for working with marketing-style HTML: paste or edit HTML in a code editor, **extract `<a href>` links**, tweak **base URL**, **Braze-style merge parameters** (`?lid={{…}}`), and **deep-link** fragments, then apply **UTM-style settings** and preview the updated markup.

Built for workflows where links are embedded in email or CRM HTML and need consistent tracking parameters without hand-editing every `href`.

## Features

- **HTML editor** — CodeMirror 6 with HTML syntax highlighting (One Dark theme), loaded on the client only to keep the first paint light.
- **Link extraction** — Parses anchor `href` values and splits them into editable parts (main URL, query / Braze token segment, deep-link suffix).
- **Per-link editing** — Adjust each extracted link and rebuild the document.
- **Settings** — Toggles for deep links and redirect behavior; configurable UTM-style fields (source, medium, campaign) with basic input sanitization.
- **Toasts** — Feedback for extract/update actions (Sonner + local toast hook).
- **API route** — `GET /api/fetch-code?url=…` fetches remote text (for integrations); the current UI is driven by pasted HTML in the editor.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| UI | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) patterns, [Radix UI](https://www.radix-ui.com/) primitives |
| Editor | [@uiw/react-codemirror](https://github.com/uiwjs/react-codemirror), `@codemirror/lang-html` |
| Icons | [lucide-react](https://lucide.dev/) |
| Lint | [ESLint 9](https://eslint.org/) flat config via `eslint-config-next` |

There is **no database** and **no Supabase** in this project; state lives in the browser while you use the app.

## Requirements

- **Node.js** 20.19+, 22.13+, or 24+ recommended (aligns with current ESLint ecosystem engine ranges).
- **npm** (or use your preferred client with equivalent commands).

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
│   ├── api/fetch-code/route.ts   # Optional server fetch helper
│   ├── Editor.tsx / Preview.tsx  # App-specific views
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── LinkWizard.tsx            # Main interactive flow
│   ├── Settings.tsx              # Link enhancement controls
│   └── ui/                       # shadcn-style primitives
├── lib/utils.ts                  # `cn()` helper
└── utils/linkUtils.ts            # Regex-based link parse/replace logic
```

`next.config.mjs` sets `turbopack.root` to this package directory so the correct app root is used when other lockfiles exist higher in the filesystem.

## Deployment

Deploy anywhere that supports Node.js and Next.js (e.g. [Vercel](https://vercel.com/)). Run `npm run build` in CI to verify type-checking and the production bundle.

## Security notes

- **`/api/fetch-code`** performs server-side `fetch` to arbitrary URLs passed in the query string. Only expose this in production if you trust callers or add your own allowlists, auth, and rate limits.
- **`package.json`** includes an **`overrides`** entry for `dompurify` so the Monaco editor dependency tree resolves a patched version (addresses known advisory noise from nested dependencies).

## License

Add a `LICENSE` file in the repository root if you want to publish terms; this README does not impose one by default.

---

Maintained by **Jonathan Rycx** — [LinkedIn](https://www.linkedin.com/in/jonathanrycx/).

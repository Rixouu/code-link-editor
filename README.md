**Code Link Editor** is a web app designed for email and CRM teams who need consistent tracking on outbound links: paste HTML, scan anchors, apply saved presets, validate domains, and export a CSV or copy governed HTML.

The current product was developed and maintained by [Jonathan Rycx](https://github.com/Rixouu), focusing on robust DOM parsing and clear governance workflows.

[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-Primitives-6366f1)](https://www.radix-ui.com/)
![PWA Ready](https://img.shields.io/badge/PWA-Install%20Banner-9ca3af)

### 🔗 Link Governance

- Paste or edit HTML in a robust CodeMirror workspace.
- Scan HTML to extract every `<a href>` in document order.
- Preview and copy the governed, modified HTML directly.

### 📝 Campaign Presets

- Brand/channel labels, UTM fields, custom `key=value` lines (merge tags allowed).
- Deep-link toggles (`$deep_link` / `$follow_redirect`).
- Defined allowed domains and required query keys.
- Saved in `localStorage` for privacy and persistence.

### ✅ Validation & Export

- Step-oriented governance flow.
- Per-link checks against the active preset.
- Validation status reporting pass/fail for current rules.
- Downloadable CSV link inventory with validation outcomes.

### Frontend

- **React 19**
- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS** (design tokens and utility classes)
- **shadcn/ui** patterns & Radix UI primitives

### Prerequisites

- **Node.js** 20.19+, 22.13+, or 24+
- **npm** (or equivalent)

### Installation

```bash
npm install
npm run dev
```

Default dev URL: **<http://localhost:3000>**

### Project Layout

```txt
src/
├── app/
│   ├── api/fetch-code/route.ts  # Optional server fetch
│   ├── globals.css              # Design tokens & utilities
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── campaign/                # Governance panels & logic
│   ├── LinkWizard.tsx           # Main workspace and tabs
│   └── ui/                      # shadcn/ui components
└── lib/
    ├── campaign/                # Presets, validation, CSV logic
    └── utils.ts                 # Tailwind utilities
```

### Development

```bash
npm run dev              # Next.js dev server (Turbopack)
```

### Build / Run

```bash
npm run build            # Production build
npm run start            # Start production server
```

### Code Quality

```bash
npm run lint             # ESLint flat config
```

### 📱 PWA & Install UX

- Dedicated install banner component for seamless installation.
- Clean mobile optimization and native app feel.

## 📊 DOM-Based Updates

- Uses `DOMParser` and ordered anchors.
- Safe from regex replacements that break naive `String.replace` approaches.

## 🔐 Security Notes

- `/api/fetch-code` triggers server-side `fetch`. Restrict or remove in production if unused.
- The app operates primarily client-side with no database, ensuring user data privacy.

## 🚀 Deployment

```bash
npm run build
npm run start
```

Deploy on Vercel or any Node host that supports Next.js.

## 📄 License

Add a `LICENSE` file if you publish terms; none is bundled by default.

## 👥 Team

- **Jonathan Rycx** — Lead Developer — [LinkedIn](https://www.linkedin.com/in/jonathanrycx/)

---

**Built with ❤️ for consistent, reliable email links.**

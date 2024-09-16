# Link Wizard

A modern web application for extracting and enhancing links, built with Next.js, TypeScript, and Supabase.

## Features

- Extract links from HTML content
- Customize link parameters (UTM tags, deep links)
- Real-time link preview and editing
- Dark mode support
- Responsive design

## Tech Stack

- [Next.js](https://nextjs.org/) with App Router
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [CodeMirror](https://codemirror.net/) for code editing

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables (see `.env.example`)
4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `app/`: Next.js App Router pages and layouts
- `components/`: Reusable React components
  - `LinkWizard.tsx`: Main component for link extraction and editing
  - `Settings.tsx`: Component for link enhancement settings
  - `ThemeToggle.tsx`: Dark mode toggle component
- `lib/`: Utility functions and shared logic
- `styles/`: Global styles and Tailwind config
- `utils/`: Helper functions, including link extraction logic

## Key Features

- Server-side rendering with Next.js
- Type-safe development with TypeScript
- Responsive UI with Tailwind CSS
- Dark mode support
- Real-time link extraction and preview
- Customizable link parameters

## Deployment

Deploy on [Vercel](https://vercel.com/) for the best Next.js experience.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

Jonathan Rycx
<https://www.linkedin.com/in/jonathanrycx/>

# Link Wizard

A modern web application for extracting and enhancing links, built with Next.js, TypeScript, and Supabase.

## Features

- Extract links from HTML content
- Customize link parameters (UTM tags, deep links)
- Real-time link preview and editing
- Responsive design
- Performance optimized with dynamic imports

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
- `lib/`: Utility functions and shared logic
- `styles/`: Global styles and Tailwind config
- `utils/`: Helper functions, including link extraction logic

## Key Features

- Server-side rendering with Next.js
- Type-safe development with TypeScript
- Responsive UI with Tailwind CSS
- Code-splitting with dynamic imports for optimal loading
- Real-time link extraction and preview
- Customizable link parameters

## Performance Optimizations

- Dynamic imports for large dependencies (CodeMirror)
- Suspense boundaries for better loading experience
- Removed unused dark mode functionality
- Memoized expensive computations

## Deployment

Deploy on [Vercel](https://vercel.com/) for the best Next.js experience.

## Changelog

### [0.3.0] - 2023-05-20

#### Added
- Performance optimizations with dynamic imports
- Suspense boundaries for better loading experience

#### Removed
- Dark mode functionality to simplify the UI and improve performance

### [0.2.0] - 2023-04-15

#### Added

- Improved switch UI in Settings component for better visibility
- Red/Green color scheme for on/off states in switches
- Enhanced error handling in link extraction process
- Loading state for "Extract Links" button

#### Changed

- Updated extracted links section UI for better readability
- Refined Settings component layout and styling

#### Fixed

- Switch visibility issues

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

Jonathan Rycx
<https://www.linkedin.com/in/jonathanrycx/>

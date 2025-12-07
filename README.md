# AppTracker Frontend

A web interface for searching Android app metadata, built for icon pack creators and mobile theme designers.

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4
- ShadcnUI

## Prerequisites

- Node.js 18+
- pnpm

## Development Setup

1. **Clone the repository**

   ```bash
   git clone git@github.com:Snipdroid/frontend-plan-b.git
   cd frontend-plan-b
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment**

   Create a `.env` file in the project root:

   ```env
   VITE_API_BASE_URL=/api
   ```

   The dev server proxies `/api` requests to the backend. To change the backend URL, edit `vite.config.ts`.

4. **Start the development server**

   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── search/      # Search feature components
│   └── ui/          # ShadcnUI components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── pages/           # Page components
├── services/        # API services
├── types/           # TypeScript type definitions
├── App.tsx
├── main.tsx
└── index.css
```

## Adding ShadcnUI Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

This is a frontend project for AppTracker, a service built for Android icon pack creators and mobile theme designer.

It provides a simple interface to search for crucial metadata for icon packs and themes. Such as app name (in different languages), package name and main activity name.

It also implemented a simple statistics system for collecting user requests. Creators and designers can register an account and create a icon pack and integrate our API so that they don't have to manually collect those information from users' emails.

## Mission

- Provide a simple interface to search for crucial metadata for icon packs and themes.
- Create a login and dashboard creators and designers to manage their icon packs and themes.

## Tech Stack

- PNPM
- TypeScript
- React 19
- Vite 7
- Tailwind CSS 4
- ShadcnUI (new-york style)

## Project Structure

```
src/
├── components/
│   ├── ui/             # ShadcnUI components
│   ├── dashboard/      # Icon pack management dashboard components
│   ├── search/         # App search interface components
│   ├── upload/         # File upload components
│   └── theme/          # Theme context and provider
├── pages/              # Page components (Home, Dashboard, Upload)
├── hooks/
│   └── swr/            # SWR data-fetching hooks
├── lib/                # Utilities, configs, parsers
├── services/           # API service modules
├── types/              # TypeScript type definitions
├── locales/            # i18n translation files (en, zh)
├── themes/             # CSS theme variants
├── App.tsx
├── main.tsx
└── index.css           # Global styles and CSS variables
```

## Adding Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

## UI/UX Design

I prefer a simple, clean look of the original ShadcnUI design. There is no need to add additional style unless it is necessary.

The design should work well on all devices, including desktop and mobile.

Respect the default behavior of the platform or browser. Do not override it. Because users' intuitions are all based on the default behavior.

## Documentation

The API to the backend is located at `swagger.json`.

However, most HTTP APIs supports pagination, which isn't documented in the `swagger.json`.

You should include these parameters in the query string:
- `page` - page number
- `per` - number of items per page

## Developer Notes

- Maintain a good file structure.
- Don't compromise on the code quality, modularity or security. If there is problem implementing a feature, don't hesitate to ask. We prefer to workaround feature problems.
- Always think about i18n and l10n.
- Always use context7 when I need code generation, set up or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.
- Be caucious about using `useEffect`.
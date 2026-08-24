# Time Matrix Editor

A local-first task and notes workspace organized around the FranklinCovey time matrix.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

The application currently has no automated browser or unit test suite. The lint, typecheck, and production build commands are the current regression checks.

## Structure

- `src/app`: Next.js routes, layouts, and global styles
- `src/components`: page and domain UI components
- `src/store`: Redux Toolkit state slices and typed hooks
- `src/services/databaseService.ts`: Dexie database schema and persistence helpers
- `public`: static assets

Tasks and notes are persisted locally in IndexedDB through Dexie. Redux provides the active in-memory view, while the UI reports persistence failures through toasts.

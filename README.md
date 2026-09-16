# Time Matrix Editor

A local-first task and notes workspace organized around the FranklinCovey time matrix.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Use as a Chrome Extension

Build the extension:

```bash
npm run build:extension
```

Then load it in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `out` folder.
5. Open a new tab.

After making changes, run `npm run build:extension` again and click **Reload** on the extension page.

Always use `npm run build:extension` for Chrome. Do not load the output from `npm run build` directly.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
npm run build:extension
```

The application currently has no automated browser or unit test suite. The lint, typecheck, and production build commands are the current regression checks. To generate the folder for `chrome://extensions`, always use `npm run build:extension`; it removes Next.js internal files that Chrome reserves, renames the asset directory, and copies the extension manifest.

## Structure

- `src/app`: Next.js routes, layouts, and global styles
- `src/components`: page and domain UI components
- `src/store`: Redux Toolkit state slices and typed hooks
- `src/services/databaseService.ts`: Dexie database schema and persistence helpers
- `public`: static assets

Tasks and notes are persisted locally in IndexedDB through Dexie. Redux provides the active in-memory view, while the UI reports persistence failures through toasts.

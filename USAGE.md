# TNMatrix Notes Editor

## Run Locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Use as a Chrome Extension

Build the extension:

```bash
npm run build:extension
```

Load it in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `out` folder in this project.
5. Open a new tab.

## After Making Changes

Run the build again:

```bash
npm run build:extension
```

Then click **Reload** on the extension page in Chrome.

Always use `npm run build:extension` for Chrome. Do not load the output from `npm run build` directly.

## Checks

```bash
npm run lint
npm run typecheck
```

The local app and Chrome extension keep separate task and note data.

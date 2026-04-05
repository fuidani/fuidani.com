# JibuDocs Reporting Prototype

This repository is a frontend prototype for a JibuDocs workflow:

1. Enter a search query.
2. Optionally refine it.
3. Review results and select documents.
4. Build a one-off or recurring report.
5. Compare included documents and add AI-style narrative insights to the export.

It is intentionally not production-ready. The goal is to make the intended product flow, UI states, and backend integration needs clear enough for implementation planning.

## Repo Layout

- `app/`: React/Vite SPA that contains the prototype UI.
- `sources/`: earlier static HTML mockups used as design/source material.
- `.github/workflows/deploy.yml`: GitHub Pages deployment for the SPA build.

## Frontend Status

- The app builds successfully.
- It uses mocked data from `app/src/data/sampleCases.js`.
- There are no real API calls yet.
- Export, subscription, and AI comparison are represented in the UI but still mocked.

## Useful Paths

- `app/src/App.jsx`: route map.
- `app/src/pages/SearchPage.jsx`: query entry.
- `app/src/pages/RefinePage.jsx`: refinement step.
- `app/src/pages/ResultsPage.jsx`: filters, selection, report launch.
- `app/src/pages/ReportPage.jsx`: report builder, compare view, export/subscription UI.
- `app/src/data/sampleCases.js`: sample document data plus report schema definitions.

## Local Commands

```bash
cd app
npm install
npm run dev
npm run build
npm run lint
```

## Backend Handoff

See `BACKEND_HANDOFF.md` for the current frontend behavior, mocked areas, and suggested backend integration surfaces.

# JibuDocs Frontend Prototype

This `app/` directory contains the React/Vite prototype for the JibuDocs search, results, and report-builder experience.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Notes

- This is a frontend-only prototype. It currently uses local sample data instead of a backend API.
- The main mocked dataset lives in `src/data/sampleCases.js`.
- Search-to-report context is currently passed through route query params and `sessionStorage`.
- Repo-level context and backend integration notes are documented in the root `README.md` and `BACKEND_HANDOFF.md`.

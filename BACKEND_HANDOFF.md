# Backend Handoff

This document describes what the frontend prototype currently does and where backend work will eventually connect.

## Current Product Intent

The prototype models a JibuDocs workflow for:

1. Searching legal or business documents.
2. Narrowing the result set.
3. Reviewing mixed document results.
4. Selecting documents for a report.
5. Building either one-off exports for selected documents or recurring reports based on a saved search.
6. Comparing included documents and appending narrative insights.

## Current Routes

- `/`: search entry screen.
- `/refine?q=...`: refinement step after an initial query.
- `/results?q=...`: results browser with filters, preview, and selection.
- `/report`: report builder and export/subscription flow.

## What Is Mocked Today

- Search results come from `app/src/data/sampleCases.js`.
- Facet counts are generated from the sample dataset in the browser.
- The "AI Narrative Analysis" comparison is locally simulated text.
- DOCX export and search subscription actions are placeholders.
- There is no auth, no persistence, and no server state.

## Current Frontend State Handoff

The frontend currently passes report context to `/report` through `sessionStorage`:

- `reportItems`: selected document ids and display labels.
- `reportDocType`: one of `case-law`, `contract`, or `financial-statement`.
- `reportSource`: source metadata such as search vs selection, query, ids, and count.
- `reportMode`: optional initial tab hint, for example compare mode.

`localStorage` is only used to remember the results preview panel width.

## Document Types In Scope

The prototype supports three document families:

- `case-law`
- `contract`
- `financial-statement`

The current schema definitions that drive report behavior live in `app/src/data/sampleCases.js`:

- `REPORT_SECTIONS_BY_TYPE`
- `FIELD_CATEGORIES_BY_TYPE`
- `DEFAULT_META_FIELDS_BY_TYPE`
- `DOC_TYPE_LABELS`

Results filtering logic is in `app/src/pages/results/constants.js`.

## Suggested Backend Surfaces

These are the main backend seams implied by the frontend.

### 1. Search

Suggested responsibility:

- accept a query string
- return mixed document results
- support filters and facets by document type and type-specific metadata
- return enough summary data for result cards and list rows

Likely frontend replacement points:

- `SearchPage`
- `RefinePage`
- `ResultsPage`
- `buildFilterSections(...)`

### 2. Result Detail / Preview

Suggested responsibility:

- return the richer document fields needed by the preview panel
- support the per-type fields already rendered in results and report views

### 3. Saved Search / Subscription

Suggested responsibility:

- persist a saved search definition
- store report configuration and delivery settings
- schedule recurring report generation

Current frontend placeholders:

- "Subscribe to Search" in results
- subscription controls in `ReportPage`

### 4. Report Generation

Suggested responsibility:

- accept selected document ids or a saved-search reference
- accept report configuration for title, subtitle, selected metadata fields, enabled sections, delivery mode, delivery method, and optional comparison appendix
- return PDF and DOCX exports

### 5. AI Comparison / Insight Generation

Suggested responsibility:

- accept two included documents plus selected sections and fields
- generate editable comparison insight text
- optionally persist curated insights with the report draft

Current frontend placeholder:

- `app/src/pages/report/CompareAIAssistant.jsx`

## Data Contract Notes

The frontend currently expects:

- a stable document id
- a `documentType` for non-case-law documents
- type-specific metadata fields used in cards, list rows, previews, and reports
- narrative/body fields used in report sections and comparison

The sample data file is the best reference for the current field expectations. It is serving as both mock content and an informal schema.

## Recommended Next Step

If backend implementation starts now, the cleanest sequence is:

1. agree on search and result payloads plus facet shapes
2. agree on report draft and export request payloads
3. replace the `sessionStorage` handoff with a persisted report draft or API-backed report context
4. decide whether AI comparison is a first-phase backend feature or remains mocked initially

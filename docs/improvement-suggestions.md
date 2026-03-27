# Household Finance Tracker – Improvement Suggestions

This document captures practical, near-term improvements based on the current product scope and implementation.

## 1) Improve onboarding and auth conversion

### Why
- The home route redirects directly to `/login`, which is efficient but misses a chance to explain value to new users.
- Help docs note that Google sign-in exists in backend routes but is not clearly visible in the UI.

### Suggestions
- Add a lightweight landing page with clear CTA buttons (`Register`, `Login`, `Continue with Google`).
- Surface a visible Google sign-in button on login/register pages when OAuth is configured.
- Add first-run onboarding checklist after signup: create household → add first expense → view dashboard.

## 2) Strengthen receipt OCR trust and usability

### Why
- Receipt parsing currently sends uploaded file content to OCR and auto-fills fields, but there is little user-facing guidance on supported file types, limits, and confidence.

### Suggestions
- Add inline helper text near file upload: supported formats, max file size, privacy note.
- Return confidence/field-source metadata from OCR route and mark auto-filled values as “needs review”.
- Add a “manual correction required” banner before allowing save when OCR confidence is low.

## 3) Make exports match dashboard expectations

### Why
- App messaging emphasizes exporting current year CSV/XLSX, while dashboard filters provide rich date and segment control.
- Export endpoint already supports filtered export paths; product clarity can be improved.

### Suggestions
- Add explicit export scope controls (date range preset/custom, include/exclude private).
- Show a pre-export summary: selected household, date range, row count estimate.
- Add scheduled monthly export by email for household owners.

## 4) Improve dashboard performance for larger households

### Why
- Dashboard currently fetches and aggregates data client-side across many dimensions; this may become heavy as data grows.

### Suggestions
- Add server-side aggregation endpoints for totals, trend buckets, and breakdown dimensions.
- Cache filter metadata and expensive aggregate calls per household/date range.
- Add loading skeletons and “last updated” timestamps for perceived performance.

## 5) Expand collaboration features

### Why
- The app already supports multi-member households, invites, and owner/member roles, which is a good base for stronger collaboration.

### Suggestions
- Add optional expense approval flow for shared budgets (owner approval threshold).
- Add comments/activity timeline on expenses.
- Add reminders for missing recurring household entries (rent/utilities).

## 6) Add budgeting and alerts

### Why
- Current analytics are descriptive (what happened). Users often also need proactive controls (what should happen).

### Suggestions
- Monthly budget per category and household with progress bars.
- Threshold alerts (e.g., groceries > 80% monthly budget).
- “Unusual spend” detection comparing current period vs historical baseline.

## 7) Improve data quality and consistency

### Why
- Flexible, user-defined categories/tags are powerful but can drift into duplicates and inconsistent naming.

### Suggestions
- Category/tag normalization suggestions (“Groceries” vs “grocery”).
- Merge/rename tools for tags and categories.
- Merchant normalization with alias mapping.

## 8) Security and privacy polish

### Why
- The app supports private expenses and household permissions; communicating and auditing privacy behavior builds trust.

### Suggestions
- Add in-app privacy explainer with concrete visibility examples.
- Add audit log view for membership and invite actions.
- Add optional masked amount display for private items in shared contexts.

## 9) Product analytics and quality loops

### Why
- Improvements are easier to prioritize with usage and quality telemetry.

### Suggestions
- Track onboarding funnel events (register → create household → first expense → return in 7 days).
- Add error monitoring for OCR failures and export failures.
- Add lightweight in-app feedback prompt after export and receipt parse.

## Suggested release sequencing

- **Phase 1 (quick wins, 1–2 sprints):** onboarding/Google button visibility, OCR helper text, export scope messaging, loading skeletons.
- **Phase 2 (3–5 sprints):** server-side dashboard aggregates, budgets + alerts, tag/category normalization tools.
- **Phase 3 (longer-term):** approvals/workflows, scheduled exports, anomaly detection.

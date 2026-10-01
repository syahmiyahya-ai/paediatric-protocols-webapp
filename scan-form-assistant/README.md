# SCAN Form Assistant

GitHub Pages interface for the existing SCAN workflow. Build with `npm install && npm run build`.

The interface supports manual case entry, IC-derived demographics, household-only offline questionnaire, answer import, source-aware review and browser PDF field mapping/export. Case data is not committed to GitHub.

AI extraction and online household submissions require a separate backend. Set its HTTPS URL using Backend connection settings. The backend must allow CORS only for this Pages origin and implement POST /api/extract, /api/household-links, /api/household-open, /api/household-submit, /api/household-response and /api/household-delete. Keep all credentials server-side. Shared household links carry only household access tokens; doctor access tokens remain in the doctor tab session.

Blank PDFs are not bundled yet: choose them in PDF templates. Store only blank templates in public/resources/borang9.pdf and public/resources/jkm.pdf; never store completed patient forms here.

Real clinical rollout still requires verified PDF mappings, backend access controls, retention and a tested complete workflow. Existing dummy-only safeguards remain until the backend is configured and rollout is deliberately enabled.

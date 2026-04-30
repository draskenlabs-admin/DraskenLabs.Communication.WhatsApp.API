# Module: Templates – Status

## Summary

| Field | Value |
|-------|-------|
| Status | ❌ Not Started |
| Completion | 0% |
| Blocking Issues | None |
| Last Updated | 2026-05-01 |

---

## Wave Status

| Wave | Name | Status | Notes |
|------|------|--------|-------|
| T.1 | DB Schema | ❌ Not Started | `MessageTemplate` model not added |
| T.2 | Template DTOs | ❌ Not Started | — |
| T.3 | Template Listing | ❌ Not Started | — |
| T.4 | Template Creation | ❌ Not Started | — |
| T.5 | Template Detail | ❌ Not Started | — |
| T.6 | Template Deletion | ❌ Not Started | — |
| T.7 | Status Sync | ❌ Not Started | — |

---

## Endpoint Status

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/wabas/:wabaId/templates` | JWT / API Key | ❌ Not built |
| POST | `/wabas/:wabaId/templates` | JWT | ❌ Not built |
| GET | `/wabas/:wabaId/templates/:id` | JWT / API Key | ❌ Not built |
| DELETE | `/wabas/:wabaId/templates/:id` | JWT | ❌ Not built |
| POST | `/wabas/:wabaId/templates/sync` | JWT | ❌ Not built |

---

## Test Coverage

| Component | Test File | Status |
|-----------|-----------|--------|
| `TemplateService` | — | ❌ Not started |
| `TemplateController` | — | ❌ Not started |

---

## Prerequisites

| Prerequisite | Status | Notes |
|-------------|--------|-------|
| Account Management — WABA connected | ✅ Complete | Tokens available for Meta API calls |
| `MessageTemplate` DB schema | ❌ Not started | Required before any development |

---

## Issues & Risks

| Issue | Severity | Notes |
|-------|----------|-------|
| Templates required for proactive messaging | High | Messaging module depends on approved templates |
| Template approval takes 24–48 hours | Medium | Plan ahead for go-live testing |
| Meta's template policy changes frequently | Medium | Keep Meta docs reference up to date |

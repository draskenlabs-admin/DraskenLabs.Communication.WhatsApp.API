# Module: Webhooks – Status

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
| W.1 | DB Schema | ❌ Not Started | Models not in schema |
| W.2 | Webhook Verification | ❌ Not Started | — |
| W.3 | Signature Validation | ❌ Not Started | — |
| W.4 | Event Ingestion | ❌ Not Started | — |
| W.5 | Message Event Handler | ❌ Not Started | — |
| W.6 | Status Update Handler | ❌ Not Started | — |
| W.7 | Template Event Handler | ❌ Not Started | — |
| W.8 | Account Event Handler | ❌ Not Started | — |
| W.9 | Read Receipt Trigger | ❌ Not Started | — |

---

## Endpoint Status

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/webhooks` | None (Meta) | ❌ Not built |
| POST | `/webhooks` | None (HMAC) | ❌ Not built |

---

## Test Coverage

| Component | Test File | Status |
|-----------|-----------|--------|
| `WebhooksService` | — | ❌ Not started |
| `WebhooksController` | — | ❌ Not started |
| Signature validation middleware | — | ❌ Not started |

---

## Prerequisites

| Prerequisite | Status | Notes |
|-------------|--------|-------|
| Meta App configured with webhook URL | ❌ Not done | Requires public HTTPS endpoint |
| `WEBHOOK_VERIFY_TOKEN` set in env | ❌ Not done | Required for verification |
| Messaging module `Message` model | ❌ Not started | Required for status update handler |

---

## Issues & Risks

| Issue | Severity | Notes |
|-------|----------|-------|
| No webhook endpoint — inbound messages cannot be received | Critical | Core product gap |
| Signature verification must be implemented before going live | High | Security requirement |
| Meta requires public HTTPS URL for webhook registration | Medium | Needs deployment infrastructure |
| Webhook events must be processed quickly (< 20s timeout) | High | Consider async queue for heavy processing |

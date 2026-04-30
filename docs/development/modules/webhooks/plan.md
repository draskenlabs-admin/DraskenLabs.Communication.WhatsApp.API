# Module: Webhooks – Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| W.1 | DB Schema | Add `WebhookEvent` and `InboundMessage` models | Migration, Prisma client |
| W.2 | Webhook Verification | Handle Meta's `GET /webhooks` challenge | Verification endpoint live |
| W.3 | Signature Validation | Verify `X-Hub-Signature-256` on POST events | Middleware rejecting invalid payloads |
| W.4 | Event Ingestion | Parse and persist all incoming webhook payloads | Raw event stored to DB |
| W.5 | Message Event Handler | Process `messages` events — persist inbound messages | `InboundMessage` records created |
| W.6 | Status Update Handler | Process `statuses` events — update outbound message status | `Message.status` updated |
| W.7 | Template Event Handler | Process template status changes — update `MessageTemplate` | Template status synced |
| W.8 | Account Event Handler | Process WABA and phone number quality events | Notifications / status updates |
| W.9 | Read Receipt Trigger | Mark messages as read on inbound delivery | Meta API call via Messaging module |

---

## Wave Detail

### Wave W.1 – DB Schema

| Task | Notes |
|------|-------|
| Add `WebhookEvent` model | `eventType`, `payload` (JSON), `processed`, `phoneNumberId` |
| Add `InboundMessage` model | `metaMessageId` (unique), `from`, `phoneNumberId`, `type`, `payload` (JSON), `timestamp` |
| Run migration | `prisma migrate dev --name add_webhook_models` |

### Wave W.2 – Webhook Verification

| Task | Notes |
|------|-------|
| `GET /webhooks` | Check `hub.mode === 'subscribe'` |
| Compare `hub.verify_token` | Against `WEBHOOK_VERIFY_TOKEN` env var |
| Respond with `hub.challenge` | Return 200 with challenge string |
| Return 403 on mismatch | Reject invalid verification attempts |

### Wave W.3 – Signature Validation

| Task | Notes |
|------|-------|
| Extract `X-Hub-Signature-256` header | Return 401 if missing |
| Compute HMAC-SHA256 of raw body | Use `META_APP_SECRET` as key |
| Compare computed vs received signature | Constant-time comparison to prevent timing attacks |
| Return 401 on mismatch | Reject tampered payloads |
| Read raw body before JSON parsing | Attach raw buffer middleware |

### Wave W.4 – Event Ingestion

| Task | Notes |
|------|-------|
| Parse webhook payload structure | `object`, `entry[].changes[]` |
| Persist `WebhookEvent` to DB | Raw JSON, unprocessed |
| Route to appropriate handler | By `field` value (`messages`, `statuses`, etc.) |
| Return 200 immediately | Meta expects fast response; process async |

### Wave W.5 – Message Event Handler

| Task | Notes |
|------|-------|
| Parse `messages` entries | Extract `from`, `id`, `type`, `timestamp`, payload |
| Upsert `InboundMessage` | Idempotent by `metaMessageId` |
| Mark `WebhookEvent.processed = true` | After successful handling |

### Wave W.6 – Status Update Handler

| Task | Notes |
|------|-------|
| Parse `statuses` entries | `id`, `status`, `timestamp`, `errors?` |
| Update `Message.status` by `metaMessageId` | `sent` → `delivered` → `read` or `failed` |
| Log errors for failed messages | `errors[].code`, `errors[].title` |

### Wave W.7 – Template Event Handler

| Task | Notes |
|------|-------|
| Parse `message_template_status_update` | `event`, `message_template_id`, `reason?` |
| Update `MessageTemplate.status` | And `rejectedReason` if applicable |

### Wave W.8 – Account Event Handler

| Task | Notes |
|------|-------|
| Parse `account_update` events | Quality rating, restriction type |
| Parse `phone_number_quality_update` | Quality tier change |
| Log and store for monitoring | No automated action in first pass |

### Wave W.9 – Read Receipt Trigger

| Task | Notes |
|------|-------|
| When inbound message processed | Call `MessagingService.markAsRead()` |
| `PUT /{phoneNumberId}/messages` | Meta API call with `metaMessageId` |

---

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `WEBHOOK_VERIFY_TOKEN` | Token set in Meta App Dashboard for verification |
| `META_APP_SECRET` | Used for HMAC-SHA256 signature verification |

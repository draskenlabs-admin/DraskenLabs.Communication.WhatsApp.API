# Module: Webhooks – Definition

## Purpose

Handles inbound events from Meta's WhatsApp Business API webhooks. Processes incoming messages from users, message delivery status updates (sent, delivered, read, failed), and account-level notifications (WABA quality updates, template status changes). Acts as the real-time event pipeline that keeps the platform in sync with Meta's state.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| Webhook verification (GET challenge) | ✅ Yes | — |
| Incoming message events | ✅ Yes | — |
| Message status update events (delivered, read, failed) | ✅ Yes | — |
| Template status change events | ✅ Yes | — |
| WABA quality rating change events | ✅ Yes | — |
| Phone number quality events | ✅ Yes | — |
| Webhook signature verification (HMAC-SHA256) | ✅ Yes | — |
| Webhook event forwarding (to client systems) | ❌ No | Future |
| Webhook event queuing / retry | ❌ No | Future |
| Real-time WebSocket push to frontend | ❌ No | Future |

---

## Event Types

| Event Category | Event Type | Description |
|---------------|-----------|-------------|
| Messages | `messages` | New inbound message from a WhatsApp user |
| Messages | `statuses` | Delivery/read status update for an outbound message |
| Account | `message_template_status_update` | Template approved, rejected, or disabled |
| Account | `account_update` | WABA quality rating or restriction changes |
| Account | `phone_number_quality_update` | Phone number quality tier change |
| Account | `phone_number_name_update` | Verified name change |

---

## Inbound Message Types Handled

| Type | Description |
|------|-------------|
| `text` | Plain text from user |
| `image` | Image attachment |
| `video` | Video attachment |
| `audio` | Audio/voice note |
| `document` | Document attachment |
| `location` | Location coordinates |
| `contacts` | Contact card(s) |
| `interactive` | Button reply or list reply |
| `reaction` | Emoji reaction |
| `sticker` | Sticker message |
| `order` | WhatsApp catalog order |
| `referral` | Click-to-WhatsApp referral data |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/webhooks` | None (Meta) | Webhook verification challenge |
| POST | `/webhooks` | None (HMAC) | Receive Meta webhook events |

---

## Security

| Mechanism | Details |
|-----------|---------|
| Verification token | `GET /webhooks?hub.verify_token=...` matches `WEBHOOK_VERIFY_TOKEN` env var |
| Payload signature | `X-Hub-Signature-256` header verified with `META_APP_SECRET` via HMAC-SHA256 |
| HTTPS required | Meta only sends to HTTPS endpoints |

---

## Data Model (Planned)

### `WebhookEvent` Table

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | PK, autoincrement |
| `eventType` | String | `messages`, `statuses`, etc. |
| `payload` | JSON | Full raw event payload |
| `processed` | Boolean | Processing status |
| `phoneNumberId` | String | Receiving phone number |
| `createdAt` | DateTime | — |

### `InboundMessage` Table

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | PK, autoincrement |
| `metaMessageId` | String | Meta message ID (unique) |
| `from` | String | Sender's WhatsApp number |
| `phoneNumberId` | String | Receiving phone number |
| `type` | String | Message type |
| `payload` | JSON | Type-specific message content |
| `timestamp` | DateTime | Meta-provided timestamp |
| `createdAt` | DateTime | — |

# Module: Templates – Definition

## Purpose

Manages WhatsApp message templates for WABAs. Provides the ability to create, list, retrieve, and delete message templates via Meta's Graph API, and track their approval status. Templates are required for sending messages outside the 24-hour customer service window and for initiating conversations.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| List templates for a WABA | ✅ Yes | — |
| Create/submit new template | ✅ Yes | — |
| Get template detail | ✅ Yes | — |
| Delete template | ✅ Yes | — |
| Sync template status from Meta | ✅ Yes | — |
| Template approval status tracking | ✅ Yes | — |
| Template localisation (multi-language) | ✅ Yes | — |
| Template analytics (sent/delivered/read counts) | ❌ No | Analytics module |
| Template A/B testing | ❌ No | Future |

---

## Template Categories

| Category | Use Case |
|----------|---------|
| `MARKETING` | Promotions, offers, announcements |
| `UTILITY` | Order updates, account alerts, confirmations |
| `AUTHENTICATION` | OTP and verification codes |

---

## Template Status Lifecycle

| Status | Description |
|--------|-------------|
| `PENDING` | Submitted, awaiting Meta review |
| `APPROVED` | Live and usable for sending |
| `REJECTED` | Rejected by Meta — reason provided |
| `DISABLED` | Paused by Meta due to quality issues |
| `IN_APPEAL` | Under appeal after rejection |
| `DELETED` | Deleted by user or Meta |

---

## Template Component Types

| Component | Description |
|-----------|-------------|
| `HEADER` | Optional — text, image, video, or document |
| `BODY` | Required — text with `{{n}}` variables |
| `FOOTER` | Optional — static text |
| `BUTTONS` | Optional — quick reply, call-to-action, or OTP |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wabas/:wabaId/templates` | JWT / API Key | List all templates for a WABA |
| POST | `/wabas/:wabaId/templates` | JWT | Create/submit a new template |
| GET | `/wabas/:wabaId/templates/:templateId` | JWT / API Key | Get template detail |
| DELETE | `/wabas/:wabaId/templates/:templateId` | JWT | Delete a template |
| POST | `/wabas/:wabaId/templates/sync` | JWT | Sync template statuses from Meta |

---

## Meta API Integration

| Operation | Meta Endpoint | Notes |
|-----------|--------------|-------|
| List templates | `GET /{wabaId}/message_templates` | Paginated |
| Create template | `POST /{wabaId}/message_templates` | Returns template ID |
| Get template | `GET /{templateId}` | Status, components |
| Delete template | `DELETE /{wabaId}/message_templates` | By name |
| Update template | `POST /{templateId}` | Body text only |

---

## Data Model (Planned)

### `MessageTemplate` Table

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | PK, autoincrement |
| `metaTemplateId` | String | Meta-assigned template ID |
| `wabaId` | Int | FK → Waba |
| `name` | String | Template name (unique per WABA) |
| `category` | Enum | `MARKETING`, `UTILITY`, `AUTHENTICATION` |
| `language` | String | BCP-47 language code (e.g., `en_US`) |
| `status` | Enum | Approval status |
| `components` | JSON | Header, body, footer, buttons |
| `rejectedReason` | String? | Populated on rejection |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

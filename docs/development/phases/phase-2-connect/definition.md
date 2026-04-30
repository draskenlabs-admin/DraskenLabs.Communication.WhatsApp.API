# Phase 2 – WhatsApp OAuth Connect: Definition

## Purpose

Implements the Meta WhatsApp Embedded Signup OAuth flow. This phase allows users to connect their WhatsApp Business Accounts to the platform by authenticating through Meta, exchanging a short-lived code for a long-lived access token, and persisting the connection with encrypted token storage. State management during the OAuth flow is handled via Redis.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| Meta OAuth token exchange | ✅ Yes | — |
| Redis-based OAuth state management | ✅ Yes | — |
| Meta Graph API business lookup | ✅ Yes | — |
| WABA ownership query (owned + client) | ✅ Yes | — |
| Token debug endpoint | ✅ Yes | — |
| Persisting user-WhatsApp connection to DB | ✅ Yes | — |
| WABA database sync | ❌ No | Handled in Phase 4 |
| Phone number sync | ❌ No | Handled in Phase 4 |
| Incoming webhook events | ❌ No | Future phase |

---

## Modules Introduced

| Module | Role |
|--------|------|
| `ConnectModule` | OAuth flow orchestration, Meta API integration |

---

## Meta API Integration

| API Call | Endpoint | Purpose |
|----------|----------|---------|
| Token Exchange | `POST /oauth/access_token` | Exchange short-lived code for long-lived token |
| Token Debug | `GET /debug_token` | Validate and inspect an access token |
| Business Lookup | `GET /{businessId}` | Fetch business profile from Meta |
| Owned WABAs | `GET /{businessId}/owned_whatsapp_business_accounts` | Get WABAs owned by this business |
| Client WABAs | `GET /{businessId}/client_whatsapp_business_accounts` | Get WABAs for which this business is a solution provider |

---

## Data Flow

| Step | Action | Storage |
|------|--------|---------|
| 1 | User initiates connect — state saved with unique key | Redis (TTL: 300s) |
| 2 | Meta redirects back with `code` — code exchanged for access token | In-memory |
| 3 | Access token stored encrypted, linked to user | PostgreSQL (`UserWhatsapp`) |
| 4 | WABA IDs returned to client for further sync | Response |

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Access token storage | Encrypted with AES-256-GCM before DB write |
| OAuth state forgery (CSRF) | Short-lived Redis state key with 300s TTL |
| Token exposure in logs | Tokens never logged, only encrypted values stored |

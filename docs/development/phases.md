# Development Phases

Overview of all development phases for the DraskenLabs WhatsApp Communication API.

---

## Phase Summary

| # | Phase | Status | Description |
|---|-------|--------|-------------|
| 1 | [Foundation & Infrastructure](./phases/phase-1-foundation/) | ✅ Complete | Project bootstrap, PostgreSQL/Prisma, Redis, AES-256-GCM encryption, shared utilities |
| 2 | [WhatsApp OAuth Connect](./phases/phase-2-connect/) | ✅ Complete | Meta Embedded Signup, token exchange, state management, phone cache |
| 3 | [User Management & SSO Auth](./phases/phase-3-user/) | ✅ Complete | Drasken SSO PKCE login, slim User model, JWT middleware with Redis cache |
| 4 | [WABA & Phone Numbers](./phases/phase-4-waba/) | ✅ Complete | WABA sync from Meta, phone number management, WABA disconnect |
| 5 | [API Key Management](./phases/phase-5-api-keys/) | ✅ Complete | API key generation, Redis caching, revocation, auth middleware |
| 6 | [Messaging](./phases/phase-6-messaging/) | ✅ Complete | Send text/media/template messages, message history, opt-out enforcement |
| 7 | [Templates & Contacts](./phases/phase-7-templates-contacts/) | ✅ Complete | Template sync from Meta, contact CRUD, opt-out flag |
| 8 | [Webhooks](./phases/phase-8-webhooks/) | ✅ Complete | Meta webhook verification, HMAC validation, inbound/status/quality events |
| 9 | [Organisation Proxy](./phases/phase-9-org/) | ✅ Complete | SSO organisation and member management proxy endpoints |
| 10 | [Testing & Documentation](./phases/phase-10-testing-docs/) | 🔄 In Progress | Unit tests (115/target), Swagger docs, frontend integration guide |

---

## Phase Dependencies

| Phase | Depends On | Reason |
|-------|-----------|--------|
| Phase 2 (Connect) | Phase 1 (Foundation) | Requires Prisma, Redis, encryption |
| Phase 3 (User/SSO) | Phase 1 (Foundation) | Requires Prisma and JWT |
| Phase 4 (WABA) | Phase 2, 3 | Requires OAuth tokens and user context |
| Phase 5 (API Keys) | Phase 3 (User) | Requires authenticated user context |
| Phase 6 (Messaging) | Phase 4, 5 | Requires phone cache and API key auth |
| Phase 7 (Templates/Contacts) | Phase 3, 4 | Requires JWT auth and WABA context |
| Phase 8 (Webhooks) | Phase 4, 7 | Requires WABA, templates, and inbound message storage |
| Phase 9 (Org Proxy) | Phase 3 (SSO) | Proxies SSO Bearer token; no local org tables |
| Phase 10 (Testing) | All Phases | Tests all implemented functionality |

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| SSO PKCE over Clerk | Drasken's own identity platform; reduces vendor dependency |
| No local Organisation/OrgMember tables | Organisation data lives in SSO; `ssoOrgId: String` used for scoping |
| API Key auth for messaging | Programmatic/server-to-server access without per-request SSO calls |
| AES-256-GCM for stored tokens | Meta access tokens are long-lived and sensitive |
| Redis phone cache | Zero DB hit on the hot path for sending messages |
| SSO proxy pattern for `/organisation` | Frontend reuses SSO token; no duplication of org state |

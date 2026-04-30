# Phase 3 – User Management: Definition

## Purpose

Provides user identity management and authentication infrastructure for the API. This phase introduces JWT-based authentication middleware backed by Clerk user IDs, user profile retrieval, and user-WhatsApp association management. It acts as the security gateway that protects all subsequent business-logic endpoints.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| JWT authentication middleware | ✅ Yes | — |
| User profile endpoint | ✅ Yes | — |
| User lookup by clerkId | ✅ Yes | — |
| User-WhatsApp association management | ✅ Yes | — |
| Access token decrypt for WhatsApp | ✅ Yes | — |
| Test token endpoint (dev only) | ✅ Yes | — |
| User registration / signup flow | ❌ No | Handled by Clerk externally |
| Role-based access control (RBAC) | ❌ No | Future phase |
| User deletion / deactivation | ❌ No | Future phase |

---

## Modules Introduced

| Module | Role |
|--------|------|
| `UserModule` | User lookup, profile, WhatsApp associations, auth middleware |

---

## Authentication Model

| Concept | Details |
|---------|---------|
| Identity Provider | Clerk |
| Token Type | JWT (signed with `JWT_SECRET`) |
| Token Location | `Authorization: Bearer <token>` header |
| Validated Fields | `sub` claim mapped to Clerk user ID |
| Middleware Scope | Applied to all routes except public ones |
| User Lookup | `clerkId` matched to `User` table record |

---

## User-WhatsApp Association

| Field | Description |
|-------|-------------|
| `userId` | FK to `User` |
| `businessId` | Meta business ID |
| `wabaId` | WhatsApp Business Account ID |
| `phoneNumberId` | Meta phone number ID |
| `accessToken` | Encrypted Meta access token (AES-256-GCM) |

Tokens are decrypted on retrieval and never stored or returned in plaintext beyond the service layer.

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| JWT forgery | Signed with `JWT_SECRET`, validated on every request |
| Plaintext token exposure | Access tokens decrypted only within service, not serialized to response |
| Test token endpoint | Returns hardcoded userId=1 — must be disabled in production |
| Unauthenticated access | Middleware rejects missing/invalid JWT with 401 |

# Module: Auth – Definition

## Purpose

Handles all authentication and authorization concerns for the application. Supports two authentication strategies: JWT-based session authentication for user-facing flows (backed by Clerk), and API key authentication for programmatic/integration access. Acts as the security gateway enforced across all protected endpoints.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| JWT validation and user loading | ✅ Yes | — |
| Clerk-backed identity resolution | ✅ Yes | — |
| API key generation (access + secret) | ✅ Yes | — |
| API key validation on requests | ✅ Yes | — |
| API key listing | ✅ Yes | — |
| API key revocation | ✅ Yes | — |
| Role-based access control (RBAC) | ❌ No | Future |
| OAuth 2.0 server (issuing tokens) | ❌ No | Clerk handles this |
| Multi-factor authentication | ❌ No | Handled by Clerk |

---

## Authentication Strategies

| Strategy | Trigger | Token Location | Validation |
|----------|---------|----------------|------------|
| JWT (Clerk) | User-facing API calls | `Authorization: Bearer <jwt>` | Verified against `JWT_SECRET`, user loaded by `clerkId` |
| API Key | Integration/programmatic calls | `x-access-key` + `x-secret-key` headers | Access key looked up in Redis cache, secret verified |

---

## Key Entities

| Entity | Description |
|--------|-------------|
| `User` | Platform user, identified by Clerk UID |
| `UserApiKey` | API key pair (access + encrypted secret) owned by a user |

---

## API Key Model

| Component | Format | Storage |
|-----------|--------|---------|
| Access Key | UUID v4 | DB plain, Redis indexed |
| Secret Key | UUID v4 | DB AES-256-GCM encrypted, Redis encrypted |
| Status | Boolean (`true` = active) | DB only |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/user/test-token` | No | Generate test JWT (dev only) |
| GET | `/user/profile` | JWT | Get authenticated user profile |
| POST | `/api-keys` | JWT | Create a new API key pair |
| GET | `/api-keys` | JWT | List user's active API keys |
| DELETE | `/api-keys/:id` | JWT | Revoke an API key |

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| JWT forgery | Signed with `JWT_SECRET`, validated per request |
| Secret key exposure | AES-256-GCM encrypted in DB; returned once on creation |
| Brute-force key enumeration | UUID access keys (122-bit entropy) |
| Test token in production | Must be gated by `NODE_ENV !== 'production'` |
| Inactive user access | Auth middleware must check `user.status === true` |

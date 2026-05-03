# Module: Auth – Definition

## Purpose

Handles all authentication and authorisation for the application. Implements two strategies:

1. **JWT** — issued after a PKCE SSO login with Drasken SSO; used for all user-facing endpoints
2. **API Key** — programmatic access for server-to-server integrations; uses `x-access-key` + `x-secret-key` headers

Organisation endpoints (`/organisation/*`) are a separate SSO proxy pattern — the SSO access token is forwarded directly; no JWT or API Key required for those routes.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| PKCE SSO login flow | ✅ Yes | — |
| JWT issuance and validation | ✅ Yes | — |
| Redis user cache (auth middleware) | ✅ Yes | — |
| API key generation (access + secret) | ✅ Yes | — |
| API key validation on requests | ✅ Yes | — |
| API key listing | ✅ Yes | — |
| API key revocation | ✅ Yes | — |
| Role-based access control (RBAC) | ❌ No | Enforced at SSO level |
| OAuth 2.0 server (issuing tokens) | ❌ No | Drasken SSO handles this |
| User registration / profile management | ❌ No | Managed by Drasken SSO |

---

## Authentication Strategies

| Strategy | Endpoints | Token Location | Validation |
|----------|-----------|----------------|------------|
| JWT | All protected routes except `/organisation` and messaging | `Authorization: Bearer <jwt>` | Verified against `JWT_SECRET`; payload: `{ sub, orgId, role }` |
| API Key | `/messages` routes | `x-access-key` + `x-secret-key` headers | Access key looked up in Redis cache, secret verified |
| SSO Token (proxy) | `/organisation/*` | `Authorization: Bearer <sso_token>` | Forwarded directly to Drasken SSO API; not validated locally |

---

## JWT Payload

```json
{
  "sub": 1,
  "orgId": "sso_org_uuid",
  "role": "admin"
}
```

`sub` → internal `User.id`; `orgId` → SSO organisation UUID (used for multi-tenant scoping); `role` → `owner | admin | member`.

---

## PKCE Login Flow

```
1. Frontend calls GET /auth/authorize?redirectUri=...&codeChallenge=...
   → API generates a state token (stored in Redis, 5 min TTL)
   → Returns { url, state } — frontend redirects user to `url`

2. User authenticates at Drasken SSO (accounts.drasken.dev)
   → SSO redirects to redirectUri with ?code=...&state=...

3. Frontend calls POST /auth/callback { code, codeVerifier, redirectUri, state }
   → API exchanges code for SSO tokens
   → Decodes SSO access token → extracts ssoId, ssoOrgId, role
   → Finds or creates User by ssoId
   → Issues internal JWT
   → Returns { access_token, user }
```

---

## API Key Model

| Component | Format | Storage |
|-----------|--------|---------|
| Access Key | `ak_` + UUID v4 | DB plain text; Redis indexed |
| Secret Key | `sk_` + UUID v4 | DB AES-256-GCM encrypted; Redis encrypted |
| Status | Boolean (`true` = active) | DB only |

---

## Redis Key Schema

| Key | TTL | Value |
|-----|-----|-------|
| `state:{uuid}` | 5 min | `{}` (presence check) |
| `user:{id}` | 15 min | `{ id, ssoId }` |
| `apiKey:{accessKey}` | None | `{ userId, ssoOrgId, secretKey (encrypted) }` |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/authorize` | None | Get SSO redirect URL and state token |
| POST | `/auth/callback` | None | Exchange SSO code for internal JWT |
| GET | `/user/profile` | JWT | Get authenticated user profile |
| POST | `/api-keys` | JWT | Create a new API key pair |
| GET | `/api-keys` | JWT | List active API keys for the user |
| DELETE | `/api-keys/:id` | JWT | Revoke an API key |

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| JWT forgery | Signed with `JWT_SECRET`; validated per request |
| PKCE code interception | `codeVerifier` only sent on callback; never stored |
| State token replay | State stored in Redis with 5 min TTL; single-use pattern |
| Secret key exposure | AES-256-GCM encrypted in DB; returned once on creation only |
| API key brute-force | `ak_` + UUID v4 (122-bit entropy); Redis lookup is constant time |
| Meta token exposure | Stored AES-256-GCM encrypted; decrypted only at request time |

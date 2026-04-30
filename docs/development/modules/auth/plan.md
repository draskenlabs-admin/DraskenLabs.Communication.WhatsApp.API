# Module: Auth – Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| A.1 | JWT Auth Middleware | Validate Bearer token, load user from Clerk ID | `AuthMiddleware`, applied to all protected routes |
| A.2 | User Profile Endpoint | Expose authenticated user profile | `GET /user/profile` |
| A.3 | API Key Generation | Generate access/secret pair, encrypt, persist, cache | `POST /api-keys` |
| A.4 | API Key Listing | Return all active keys for a user (without secrets) | `GET /api-keys` |
| A.5 | API Key Auth Strategy | Validate `x-access-key` + `x-secret-key` on requests | API key guard/middleware |
| A.6 | API Key Revocation | Soft-delete key, invalidate Redis cache | `DELETE /api-keys/:id` |
| A.7 | User Status Guard | Reject deactivated users at auth middleware level | Status check in `AuthMiddleware` |

---

## Wave Detail

### Wave A.1 – JWT Auth Middleware

| Task | Notes |
|------|-------|
| Extract `Authorization: Bearer <token>` | Return 401 if missing |
| Verify JWT with `JWT_SECRET` | Return 401 if invalid/expired |
| Extract `sub` → `clerkId` | — |
| Load user from DB by `clerkId` | Return 401 if not found |
| Attach user to `req.user` | Available in downstream controllers |

### Wave A.2 – User Profile Endpoint

| Task | Notes |
|------|-------|
| `GET /user/profile` | Return `UserProfileDto` for `req.user` |
| Add Swagger response docs | `@ApiResponse` with `UserProfileDto` example |

### Wave A.3 – API Key Generation

| Task | Notes |
|------|-------|
| Generate UUID v4 for `accessKey` | Public identifier |
| Generate UUID v4 for `secretKey` | Secret — encrypt before storing |
| Persist `UserApiKey` to DB | `status: true` by default |
| Cache `apiKey:{accessKey}` in Redis | `{ userId, secretKey: encrypted }` |
| Return plaintext `secretKey` once | Only in creation response — never again |

### Wave A.4 – API Key Listing

| Task | Notes |
|------|-------|
| Query `UserApiKey` by `userId` | Filter `status: true` |
| Exclude secret key from response | Return `accessKey`, `id`, `status`, `createdAt` only |

### Wave A.5 – API Key Auth Strategy

| Task | Notes |
|------|-------|
| Read `x-access-key` from headers | Return 401 if missing |
| Lookup Redis `apiKey:{accessKey}` | Return 401 if not found |
| Verify `x-secret-key` against stored encrypted secret | Decrypt and compare |
| Attach resolved user to request | Load user by `userId` from cached entry |

### Wave A.6 – API Key Revocation

| Task | Notes |
|------|-------|
| `DELETE /api-keys/:id` | Require JWT auth |
| Set `status: false` in DB | Soft delete |
| Delete `apiKey:{accessKey}` from Redis | Immediate invalidation |

### Wave A.7 – User Status Guard

| Task | Notes |
|------|-------|
| Check `user.status === true` in `AuthMiddleware` | Return 401 with message if deactivated |

---

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing and verification secret |
| `ENCRYPTION_KEY` | AES-256-GCM key for secret key encryption |

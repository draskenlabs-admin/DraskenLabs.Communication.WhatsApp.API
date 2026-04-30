# Phase 3 – User Management: Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| 3.1 | User DTOs | Define user profile DTO and related response shapes | `UserProfileDto` |
| 3.2 | UserService | Implement user lookup by ID and clerkId | `UserService` with DB queries |
| 3.3 | UserWhatsappService | Implement user-WhatsApp association management with token encryption | `UserWhatsappService` |
| 3.4 | Auth Middleware | Implement JWT validation middleware, attach user to request context | `AuthMiddleware` |
| 3.5 | User Controller | Implement `GET /user/profile` and `POST /user/test-token` | Endpoints live, Swagger docs |
| 3.6 | Route Protection | Register middleware on all protected routes in `UserModule` | Auth enforced across all modules |

---

## Wave Detail

### Wave 3.1 – User DTOs

| Task | Notes |
|------|-------|
| `UserProfileDto` | `id`, `clerkId`, `firstName`, `lastName`, `email`, `status`, `createdAt` |
| Swagger decorators on all fields | `@ApiProperty()` for all DTO fields |

### Wave 3.2 – UserService

| Task | Notes |
|------|-------|
| `findById(id)` | Look up user by primary key |
| `findByClerkId(clerkId)` | Look up user by Clerk UID (used in auth middleware) |
| `findByEmail(email)` | Look up user by email |
| Return `null` on not found | Middleware handles the 401 |

### Wave 3.3 – UserWhatsappService

| Task | Notes |
|------|-------|
| `findByUserId(userId)` | Get all WhatsApp connections for a user |
| `findByUserAndBusiness(userId, businessId)` | Get specific connection |
| `upsert(dto)` | Create or update connection, encrypt token before write |
| `getDecryptedToken(userId, businessId)` | Retrieve and decrypt access token |

### Wave 3.4 – Auth Middleware

| Task | Notes |
|------|-------|
| Extract Bearer token from `Authorization` header | Return 401 if missing |
| Verify JWT with `JWT_SECRET` | Return 401 if invalid/expired |
| Extract `sub` claim as clerkId | Look up user in DB |
| Attach `user` to `request` object | Available in controllers as `req.user` |
| Return 401 if user not found | User may be deactivated |

### Wave 3.5 – User Controller

| Task | Notes |
|------|-------|
| `GET /user/profile` | Return `UserProfileDto` for authenticated user |
| `POST /user/test-token` | Return JWT for hardcoded userId=1 (dev only) |
| Swagger decorators | Document all endpoints with response shapes |

### Wave 3.6 – Route Protection

| Task | Notes |
|------|-------|
| Register `AuthMiddleware` in `UserModule` | Apply to protected route patterns |
| Exclude public routes | `/`, `/connect/*`, `/user/test-token`, Swagger |

---

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing and verifying JWTs |

# Phase 2 – WhatsApp OAuth Connect: Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| 2.1 | DTOs & Interfaces | Define request/response DTOs for connect flow | `ConnectWabaDto`, `WabaNumberDto`, `DebugTokenRequestDto`, `WabaConnectStateDto` |
| 2.2 | Redis State Management | Implement OAuth state save/load/clear via Redis | State stored/retrieved with TTL |
| 2.3 | Meta Token Exchange | Implement token exchange with Meta's OAuth endpoint | `accessToken` obtained from `code` |
| 2.4 | Meta Graph API Calls | Implement business, owned WABA, client WABA queries | Graph API data returned |
| 2.5 | Token Debug Endpoint | Implement `POST /connect/debugToken` | Token info returned from Meta |
| 2.6 | Connect Endpoint | Implement `POST /connect` — tie together token exchange, state, DB write | User-WhatsApp connection persisted |
| 2.7 | State-Based Queries | Implement `GET /connect/businesses` and WABA sub-routes from state | Business/WABA data from Redis state |

---

## Wave Detail

### Wave 2.1 – DTOs & Interfaces

| Task | Notes |
|------|-------|
| `ConnectWabaDto` | `code`, `state`, `businessId`, `wabaIds[]` fields |
| `WabaNumberDto` | Represents a phone number from Meta response |
| `DebugTokenRequestDto` | `inputToken` field |
| `WabaConnectStateDto` | `userId`, `accessToken`, `businesses[]` stored in Redis |

### Wave 2.2 – Redis State Management

| Task | Notes |
|------|-------|
| Generate unique state key | UUID stored in Redis |
| Save state with TTL | 300 seconds expiration |
| Load state by key | Deserialize JSON from Redis |
| Clear state after use | Delete key on successful connect |

### Wave 2.3 – Meta Token Exchange

| Task | Notes |
|------|-------|
| Call Meta `/oauth/access_token` | Pass `code`, `redirect_uri`, `client_id`, `client_secret` |
| Parse access token response | Extract `access_token` |
| Handle token exchange errors | Return structured error to client |

### Wave 2.4 – Meta Graph API Calls

| Task | Notes |
|------|-------|
| Fetch business profile | `GET /{businessId}` |
| Fetch owned WABAs | `GET /{businessId}/owned_whatsapp_business_accounts` |
| Fetch client WABAs | `GET /{businessId}/client_whatsapp_business_accounts` |
| Pass user token in requests | `Authorization: Bearer <token>` |

### Wave 2.5 – Token Debug Endpoint

| Task | Notes |
|------|-------|
| Implement `POST /connect/debugToken` | Accept `inputToken` in body |
| Call Meta debug endpoint | `GET /debug_token?input_token=...` |
| Return token metadata | App ID, scopes, expiry, user ID |

### Wave 2.6 – Connect Endpoint

| Task | Notes |
|------|-------|
| Accept `POST /connect` (auth required) | Body: `ConnectWabaDto` |
| Exchange code for token | Call token exchange |
| Write `UserWhatsapp` record | Encrypt access token, upsert by `(userId, businessId)` |
| Return connected WABA IDs | Response to client |

### Wave 2.7 – State-Based Queries

| Task | Notes |
|------|-------|
| `GET /connect/businesses` | Load businesses from Redis state |
| `GET /connect/:businessId/ownedWABAs` | Load state, call owned WABAs API |
| `GET /connect/:businessId/clientWABAs` | Load state, call client WABAs API |

---

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `META_APP_ID` | Meta application ID |
| `META_APP_SECRET` | Meta application secret |
| `META_REDIRECT_URI` | OAuth redirect URI registered with Meta |

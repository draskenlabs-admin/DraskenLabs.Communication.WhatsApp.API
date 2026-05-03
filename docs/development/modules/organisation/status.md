# Module: Organisation – Status

## Summary

| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| Completion | 100% |
| Blocking Issues | None |
| Last Updated | 2026-05-03 |

---

## Wave Status

| Wave | Name | Status | Notes |
|------|------|--------|-------|
| O.1 | OrgService SSO proxy | ✅ Complete | Proxies all requests using forwarded Authorization header |
| O.2 | OrgController | ✅ Complete | 8 endpoints; reads `req.headers.authorization` directly |
| O.3 | Swagger docs | ✅ Complete | `sso-token` security scheme; `@ApiHeader` documents Authorization header |
| O.4 | DTO definitions | ✅ Complete | `OrganisationDto`, `MemberDto`, `InvitationDto`, `InviteMemberDto`, `UpdateMemberRoleDto`, `UpdateOrganisationDto` |

---

## Endpoint Status

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/organisation` | ✅ Live |
| GET | `/organisation/:orgId` | ✅ Live |
| PATCH | `/organisation/:orgId` | ✅ Live |
| GET | `/organisation/:orgId/members` | ✅ Live |
| POST | `/organisation/:orgId/members/invite` | ✅ Live |
| PATCH | `/organisation/:orgId/members/:userId/role` | ✅ Live |
| DELETE | `/organisation/:orgId/members/:userId` | ✅ Live |
| GET | `/organisation/:orgId/invitations` | ✅ Live |

---

## Test Coverage

| Component | Test File | Status |
|-----------|-----------|--------|
| `OrgService` | — | ❌ Missing |
| `OrgController` | — | ❌ Missing |

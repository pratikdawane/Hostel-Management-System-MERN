# Authentication & User Management

**Status:** Implemented
**Spec number:** 001
**Related FRD sections:** FR-1, FR-2
**Note:** written retroactively, after the module shipped — describes what was actually built and
serves as the template's reference example.

## Problem

The hostel needs staff accounts with different capabilities (owner vs. day-to-day operator vs.
resident self-service), without a public sign-up that would let a stranger register as Admin or
impersonate a resident.

## Scope

- In scope: bootstrap Admin creation, login/logout, access+refresh token sessions, password
  change with session revocation, Admin-only account creation/listing/activation for
  Manager/Resident/Admin accounts.
- Out of scope (deferred): email invitations/password reset emails (no email service exists),
  per-session device management UI, audit log of account changes.

## Roles & permissions

| Action | Admin | Manager | Resident |
| --- | --- | --- | --- |
| Bootstrap the first Admin | ✅ (once, only while no Admin exists) | — | — |
| Log in / log out / change own password | ✅ | ✅ | ✅ |
| Create/list/activate/deactivate accounts | ✅ | ❌ | ❌ |

## Data model

`User` (`backend/src/models/user.model.ts`): `name`, `email` (unique), `password` (bcrypt hash,
`select: false`), `role` (`admin`\|`manager`\|`resident`), `phone?`, `isActive`, `tokenVersion`
(`select: false`, drives session revocation), `passwordChangedAt?` (`select: false`),
`createdBy?` (ref `User`), timestamps. `toJSON` strips `password`, `tokenVersion`,
`passwordChangedAt`, and swaps `_id` for the `id` virtual.

## User flows

1. First run: visitor opens Setup → submits name/email/password → account created as Admin,
   logged in immediately.
2. Returning user: Login → email/password → redirected to Dashboard; refreshing the page keeps
   them logged in via the silent refresh-cookie flow.
3. Admin → Manage Users → Add user → fills name/email/role/initial password → new account
   appears in the list immediately.
4. Admin → toggles a user's status → Deactivate; that user's active sessions stop working on
   their very next request.
5. Any user → Change Password → current + new password → succeeds, every *other* session for
   that account is invalidated, current session stays logged in.

## API surface

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public, once | Bootstrap the first Admin |
| POST | `/api/auth/login` | Public | Log in |
| POST | `/api/auth/refresh` | Public (cookie) | Rotate session, issue new access token |
| POST | `/api/auth/logout` | Public | Clear the refresh cookie |
| GET | `/api/auth/me` | Authenticated | Current user profile |
| PUT | `/api/auth/change-password` | Authenticated | Change password, revoke other sessions |
| POST | `/api/users` | Admin | Create a Manager/Resident/Admin account |
| GET | `/api/users` | Admin | List accounts (paginated, role filter) |
| PATCH | `/api/users/:id/status` | Admin | Activate/deactivate an account |

## Edge cases & rules (as implemented)

- Second call to `/api/auth/register` after an Admin exists → `403`.
- Login to a deactivated account → `403` with an explicit message, not a generic auth failure.
- An Admin cannot deactivate their own account (`400`).
- An Admin cannot deactivate the last remaining active Admin (`400`) — prevents total lockout.
- `/api/auth/login` and `/api/auth/register` are rate-limited (10 requests / 15 min / IP) against
  brute force.
- Validation errors return `{ fieldErrors, formErrors }` shaped for direct use in form UIs.

## Acceptance criteria

- [x] Bootstrap creates exactly one Admin and never a second via the public route.
- [x] Access token never touches `localStorage`; refresh token is `httpOnly`.
- [x] Password change invalidates other sessions but not the current one.
- [x] Deactivation blocks login and invalidates existing sessions immediately.
- [x] Non-Admin roles get `403` from every `/api/users` route.
- [x] Full flow verified in a real browser (not just typecheck), including session restore on
      page reload and the mobile responsive layout.

## Notes from implementation

- Caught live (not by typecheck/lint): the `User` model didn't enable Mongoose's `id` virtual in
  `toJSON`, so API responses carried `_id` instead of `id` — broke the frontend's `User` type
  contract and React list keys in Manage Users. Fixed by enabling the virtual and stripping raw
  `_id`. Recorded here as a reminder that new models need the same `toJSON` treatment.

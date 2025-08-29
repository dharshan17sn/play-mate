# Play‑Mate API Integration Reference

This document provides clean, copy‑paste friendly examples for integrating with the backend.

All responses follow:
```json
{ "success": true, "message": "...", "data": {}, "timestamp": "..." }
```

Auth header (protected):
```
Authorization: Bearer <jwt>
```

---

## Users (base `/api/v1/users`)

### Login
POST `/login`
```json
{ "identifier": "email-or-user_id", "password": "string" }
```
Response 200
```json
{
  "success": true,
  "data": {
    "user": { "user_id": "string", "email": "string", "displayName": "string" },
    "token": "jwt"
  }
}
```

### Request Registration OTP
POST `/register/request-otp`
```json
{ "email": "user@example.com" }
```
- 200 on success
- 409 if email already registered

### Verify Registration OTP (create account)
POST `/register/verify-otp`
```json
{
  "email": "user@example.com",
  "code": "123456",
  "user_id": "john_doe01",
  "displayName": "John Doe",
  "password": "StrongPass!234",
  "gender": "optional",
  "location": "optional"
}
```
Response 201 `{ user, token }`

### Forgot Password
- Request OTP: POST `/forgot-password/request-otp` `{ "email": "..." }` → 200 or 404
- Reset: POST `/forgot-password/reset` `{ "email": "...", "code": "...", "newPassword": "..." }` → 200

### Profile
- GET `/profile` (auth)
- PUT `/profile` (auth)
```json
{ "displayName": "New Name", "photo": "url?", "gender": "?", "location": "?" }
```

### Change Password (auth)
PUT `/change-password`
```json
{ "currentPassword": "string", "newPassword": "string" }
```

### Delete User (auth)
DELETE `/:user_id` (only delete own account)

### Public User Reads
- GET `/:user_id`
- GET `/:user_id/teams`
- GET `/` with `?page&limit&search`
- GET `/search` with `?page&limit&search&user_id&displayName`

---

## Games (base `/api/v1/games`)

Note: `name` is the primary key.

- GET `/` → list games
- POST `/` body `{ "name": "Game Name" }` → 201/409
- GET `/:name` → a game by its name
- POST `/init` → idempotent seed of defaults

---

## Teams (base `/api/v1/teams`) (auth)

### Create Team
POST `/`
```json
{ "title": "Team Name", "description": "optional", "photo": "optional", "gameName": "Game Name" }
```
Response 201
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Team Name",
    "creatorId": "user_id",
    "gameName": "Game Name",
    "game": { "name": "Game Name" },
    "members": [ { "id": "...", "userId": "...", "displayName": "...", "status": "ACCEPTED" } ]
  }
}
```

### Get My Teams
GET `/my`

### Get All Teams
GET `/all?page=1&limit=10&search=optional`
Response contains `{ teams, pagination }`

### Team by ID
- GET `/:teamId`
- PUT `/:teamId` body `{ "title?": "...", "description?": "...", "photo?": "..." }`
- DELETE `/:teamId` (only creator can delete)

### Public
GET `/user/:userId` → teams for a user

---

## Invitations (base `/api/v1/invitations`) (auth)

### Send Invitation
POST `/`
```json
{ "toUserId": "user_b", "teamId": "uuid" }
```
Response 201 → invitation object

### Lists
- GET `/sent` → invitations sent by current user
- GET `/received` → invitations received by current user

### Single Invitation
- GET `/:invitationId`
- PUT `/:invitationId/accept`
- PUT `/:invitationId/reject`
- DELETE `/:invitationId` (cancel by sender)

---

## Errors

Error shape example:
```json
{ "success": false, "message": "Error message", "error": "optional details", "timestamp": "..." }
```

## Notes
- Use JWT in `Authorization` header for all team/invitation/user protected routes.
- `gameName` must be an existing Game before creating a Team.
- Only team creator can delete a team; only invitee can accept/reject; only sender can cancel.

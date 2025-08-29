# Play-Mate Backend API

A TypeScript/Express + Prisma backend for the Play‑Mate platform.

## Quick Start

1) Install deps

```bash
npm install
```

2) Configure environment

Create `.env` with at least:

```env
# Core
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/playmate"

# JWT
JWT_SECRET="replace-with-strong-secret"
JWT_EXPIRES_IN="7d"

# Email (optional; for OTP flows)
# Use either SMTP provider creds or Gmail app password
# SMTP_PROVIDER=gmail
# SMTP_USER=you@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=you@gmail.com
# Or generic SMTP:
# SMTP_HOST=smtp.mailtrap.io
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=...
# SMTP_PASS=...
# SMTP_FROM=you@example.com
```

3) Database (Prisma)

```bash
# Generate client
npm run db:generate

# Apply schema (safe)
npm run db:push

# Or manage migrations
npm run db:migrate

# Optional: Prisma Studio
npm run db:studio
```

4) Start server

```bash
npm run dev
# http://localhost:3000
```

5) Run tests (Vitest + Supertest)

```bash
npm test
```

- Optional integration test env (to exercise team/invitation flows):
```bash
export TEST_USER_A_ID="userA" TEST_USER_A_PASSWORD="passA"
export TEST_USER_B_ID="userB" TEST_USER_B_PASSWORD="passB"
```

## Project Structure

```
src/
├─ app.ts                  # Express app (routes + middleware)
├─ index.ts                # Server bootstrap
├─ config/                 # App + DB config
├─ controllers/            # Route handlers
├─ middleware/             # auth, validation, errors
├─ routes/                 # Express routers
├─ services/               # Business logic (Prisma access)
├─ utils/                  # logger, response builder, errors
└─ scripts/                # seed, utilities
```

## Authentication Overview

- JWT based. Send `Authorization: Bearer <token>` on protected routes.
- Login accepts email or user_id via `identifier`.
- Registration uses OTP flow: request OTP, verify OTP to create account.
- Forgot password uses OTP flow: request OTP, then reset.

## Global Response Shape

```json
{
  "success": true,
  "message": "...",
  "data": { },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Errors:
```json
{
  "success": false,
  "message": "...",
  "error": "optional details",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Games API (base: `/api/v1/games`)

Note: `Game.name` is the primary key.

- GET `/`  public
  - Returns all games

- POST `/`  public
  - Body: `{ name: string }`
  - 201 created or 409 conflict

- GET `/:name`  public
  - Returns a game by its name

- POST `/init`  public (idempotent)
  - Seeds default games if none exist

### Types
```ts
// Game
{ name: string }
```

## Teams API (base: `/api/v1/teams`)

All routes require auth unless noted.

- POST `/`  protected
  - Body: `{ title: string; description?; photo?; gameName: string }`
  - Creates a team for the referenced game name

- GET `/my`  protected
  - Current user teams

- GET `/all`  protected
  - Query: `page, limit, search?`
  - Returns `{ teams, pagination }`

- GET `/:teamId`  protected
  - Returns a team with members

- PUT `/:teamId`  protected
  - Body (partial): `{ title?, description?, photo? }`

- DELETE `/:teamId`  protected
  - Only team creator can delete (403 otherwise)

- GET `/user/:userId`  public
  - Teams for userId

### Types
```ts
// Team
{
  id: string;
  title: string;
  description?: string;
  photo?: string;
  creatorId: string;
  gameName: string;
  members: Array<{ id: string; userId: string; displayName: string; status: string; joinedAt: string }>;
  game: { name: string };
}
```

## Invitations API (base: `/api/v1/invitations`) (auth required)

- POST `/`
  - Body: `{ toUserId: string; teamId: string }`
  - Creates a pending invitation

- GET `/sent`
  - Invitations sent by current user

- GET `/received`
  - Invitations received by current user

- GET `/:invitationId`
  - Single invitation

- PUT `/:invitationId/accept`
  - Accepts invitation (invitee only)

- PUT `/:invitationId/reject`
  - Rejects invitation (invitee only)

- DELETE `/:invitationId`
  - Cancels invitation (sender)

### Types
```ts
// Invitation
{
  id: string;
  fromUserId: string;
  toUserId: string;
  teamId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  sentAt: string;
}
```

## Validation (Zod) Highlights

- Users
  - `userRegistrationSchema`: user_id(min 8), displayName, email, password
  - `userLoginSchema`: identifier(min 8), password
- Teams
  - `teamCreateSchema`: title, description?, photo?, gameName
- Invitations
  - `invitationCreateSchema`: toUserId, teamId

## Local Dev Notes

- OTP email sending falls back to console logs in non‑production if SMTP isn’t configured.
- For testing protected flows, use existing users or seed users and log in to get a JWT.

## System Requirements

- Operating System: macOS, Linux, or Windows (WSL recommended on Windows)
- Node.js: v18 or newer
- Package Manager: npm (included with Node.js)
- Database: PostgreSQL 13+
- Prisma CLI: installed via project devDependencies
- Optional: Bun (for faster local dev) and Docker (if containerizing)

## API Integration Reference

See `API_ENDPOINTS.md` for the full endpoint catalog with request/response examples and integration notes.

## Health and Root

- GET `/health` → `{ status: 'OK', timestamp, uptime, environment }`
- GET `/` → info + links

## Troubleshooting

- Prisma errors about missing/old columns → run `npm run db:push` or `npm run db:migrate`.
- Gmail SMTP EAUTH 534 → use an App Password (enable 2FA) or a dev SMTP (e.g., Mailtrap).

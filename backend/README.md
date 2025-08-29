# Play-Mate Backend API

A TypeScript/Express + Prisma backend for the Play‑Mate platform.

## Quick Start

1) Install Bun (recommended) or Node.js

Using Bun (Linux/macOS):
```bash
curl -fsSL https://bun.sh/install | bash
# restart your terminal or source your shell profile so `bun` is on PATH
```

Using Node.js: install v18+ from nodejs.org or via nvm.

2) Install deps

```bash
# with Bun
bun install

# or with npm
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
bun run db:generate    # or: npm run db:generate

# Apply schema (safe)
bun run db:push        # or: npm run db:push

# Or manage migrations
bun run db:migrate     # or: npm run db:migrate
```

4) Start server

```bash
# with Bun
bun run dev
# http://localhost:3000

# or with npm
npm run dev
```

5) Run tests (Vitest + Supertest)

```bash
# with Bun
bun test

# or with npm
npm test
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


## System Requirements

- Operating System: macOS, Linux, Windows
- Bun runtime and package manager
- Or Node.js v22 or newer (if not using Bun)
- Database: PostgreSQL 13+
- Prisma CLI: via project devDependencies

## Docker (optional, for Postgres without local install)

If you prefer not to install PostgreSQL locally, use Docker:

1) Start Postgres
```bash
docker run -d --name playmate-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=playmate \
  -p 5432:5432 postgres:15
```

2) Set DATABASE_URL in `.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/playmate"
```

3) Apply schema and generate client
```bash
bun run db:push && bun run db:generate
```

4)  Connect with psql in the container
```bash
docker exec -it playmate-postgres psql -U postgres -d playmate
```
- you can run raw query here and check the sql tables

## API Integration Reference

See `API_ENDPOINTS.md` for the full endpoint catalog with request/response examples and integration notes.

## Health and Root

- GET `/health` → `{ status: 'OK', timestamp, uptime, environment }`
- GET `/` → info + links

## Troubleshooting

- Prisma errors about missing/old columns → run `bun run db:push` or `bun run db:migrate` (or npm equivalents).
- Gmail SMTP EAUTH 534 → use an App Password.

# Play-Mate Backend API

A TypeScript/Express + Prisma backend for the Play‑Mate platform.

## Quick Start

1) Install Bun (recommended) 

Using Bun (Linux/macOS):
```bash
npm install -g bun
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

```bash
cp .env.example .env
# then edit .env to match your local setup (DB URL, JWT, SMTP, etc.)
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

### Test Users Setup (recommended for integration tests)

Register two users and put their credentials in `.env` so the test scripts can run protected routes.

Using Postman :

1) Create a collection "Play‑Mate"

2) Request 1: POST `http://localhost:3000/api/v1/users/register/request-otp`
- Headers: `Content-Type: application/json`
- Body (JSON): `{ "email": "userA@example.com" }`
- Duplicate the same request for `userB@example.com`.

3) Get OTP codes

-  read OTPs from the mail inboxes.

4) Request 2: POST `http://localhost:3000/api/v1/users/register/verify-otp`
- Headers: `Content-Type: application/json`
- Body (JSON) for User A:
```json
{
  "email": "userA@example.com",
  "code": "<OTP_A>",
  "user_id": "userA",
  "displayName": "User A",
  "password": "passA123!"
}
```
- Send the same for User B (replace email/code/user_id/password accordingly).

5) Request 3: POST `http://localhost:3000/api/v1/users/login`
- Headers: `Content-Type: application/json`
- Body (JSON): `{ "identifier": "userA", "password": "passA123!" }`
- Save the returned `token` as a Postman variable if you want to explore protected routes manually.

6) Update `.env` with:
```env

USER_A_ID=userA
USER_A_PASSWORD=passA123!

USER_B_ID=userB
USER_B_PASSWORD=passB123!
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

### User Registration via Postman

1) Request OTP
- Method: POST
- URL: `http://localhost:3000/api/v1/users/register/request-otp`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "user@example.com"
}
```

2) Verify OTP (complete registration)
- Method: POST
- URL: `http://localhost:3000/api/v1/users/register/verify-otp`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "user@example.com",
  "code": "123456",
  "user_id": "your_user_id",
  "displayName": "Your Name",
  "password": "StrongPass!234",
  "gender": "optional",
  "location": "optional"
}
```
Tip: If SMTP isn’t configured, OTP codes are logged to the server console in non‑production.

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

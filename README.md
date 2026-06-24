# Play-Mate Gaming Platform

Welcome to the **Play-Mate** repository. Play-Mate is a comprehensive gaming matchup and team formation platform.

This is a multi-project repository containing both the frontend client and the backend server.

---

## 📁 Repository Structure

* **[`backend/`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/backend)**: Express API built with TypeScript and Prisma ORM.
* **[`frontend/`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/frontend)**: React SPA built with TypeScript, Vite, and Tailwind CSS.
* **[`logs/`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/logs)**: Application runtime logs (ignored by git).

---

## 🛠️ Prerequisites

To run this project locally, ensure you have installed:
* **Node.js** (v20+ recommended) or **Bun** runtime (highly recommended for backend development)
* **PostgreSQL** database (version 13 or newer)

---

## 🚀 Local Development Quick Start

Follow these steps to launch both projects:

### 1. Database Setup
Ensure your PostgreSQL instance is running. 
1. Create a database named `playmate`.
2. Navigate to [`backend/`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/backend):
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Update the `DATABASE_URL` in `.env` with your Postgres connection string.
4. Run migrations and generate the Prisma Client:
   ```bash
   bun run db:push && bun run db:generate
   # Or with npm: npm run db:push && npm run db:generate
   ```

### 2. Start the Backend Server
From the [`backend/`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/backend) directory, run:
```bash
bun run dev
# Or with npm: npm run dev
```
The server starts on `http://localhost:4000`.

### 3. Start the Frontend Client
In a new terminal, navigate to [`frontend/`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/frontend):
```bash
cd frontend
npm run dev
```
The web app will open at `http://localhost:5173`.

---

## 📖 Sub-project Guides

For detailed specifications, routes, and development commands:
* Check the backend guide: **[`backend/README.md`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/backend/README.md)**
* Check the frontend guide: **[`frontend/README.md`](file:///c:/Users/dhars/OneDrive/Desktop/play/play-mate/frontend/README.md)**

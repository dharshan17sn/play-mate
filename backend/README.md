# Playmate Backend

This is the backend service for **Playmate**. It is built using **Node.js**, **Express**, and **Prisma** for database access.

---

## 📂 Project Structure
backend/
│── node_modules/ # Installed dependencies
│── prisma/
│ └── schema.prisma # Prisma schema (DB models)
│── src/
│ ├── middleware/ # Middleware functions
│ ├── routes/ # API route handlers
│ ├── prismaClient.js # Prisma client setup
│ └── server.js # Main server file
│── .env # Environment variables
│── package.json # Project metadata & dependencies
│── package-lock.json # Dependency lock file


---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd playmate/backend

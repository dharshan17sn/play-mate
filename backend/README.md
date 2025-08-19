# Playmate Backend

This is the backend service for **Playmate**. It is built using **Node.js**, **Express**, and **Prisma** for database access.

---

## 📂 Project Structure
```bash
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

```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/dharshan17sn/play-mate.git
cd playmate/backend
```

---


2. Install Dependencies
```bash
npm install
```
---

3. Configure Environment Variables

Create a .env file in the backend/ directory and add your environment variables, for example:
```bash
DATABASE_URL="your_database_connection_string"
PORT=5000
```

---

4. Set Up the Database
Make sure your database is running, then run Prisma migrations:
```bash
npx prisma migrate dev --name init
```
---

5. Start the Server
```bash
npm start
```

---

🚀 API Endpoints

User Routes: /api/users – Create, read, update, delete users.

Playmate Routes: /api/playmates – Manage playmate-related data.

Auth Routes: /api/auth – Login, register, and authentication.

For detailed API documentation, refer to the route files in src/routes/.

---

🛠 Technologies Used

Node.js

Express

Prisma

PostgreSQL / MySQL (or your chosen database)

dotenv

---

📜 License

This project is licensed under the MIT License.

---

💡 Notes

Ensure you have Node.js >= 18 installed.

Prisma client should be regenerated after updating the schema:
```bash
npx prisma generate
```

I can also help you add a **Usage Examples** section and a **Contribution Guide** if you want your README to be more user-friendly and complete. Do you want me to do that next?
---
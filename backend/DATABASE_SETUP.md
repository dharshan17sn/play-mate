# PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL with your Playmate MVP project using Prisma.

## Prerequisites

1. **PostgreSQL installed** on your machine
2. **Node.js and npm** installed
3. **Git** for version control

## Quick Setup

### 1. Run the automated setup script
```bash
npm run setup
```

This will:
- Create a `.env` file with template values
- Generate the Prisma client
- Run initial database migrations

### 2. Update your `.env` file
Edit the `.env` file and update the `DATABASE_URL` with your actual PostgreSQL credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

**Example for local development:**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/playmate_dev?schema=public"
```

## Manual Setup Steps

### 1. Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Start PostgreSQL service
- **Windows**: Start from Services or use pgAdmin
- **macOS**: `brew services start postgresql`
- **Linux**: `sudo systemctl start postgresql`
### 3. Create a database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE playmate_dev;

# Exit
\q
```

### 4. Update environment variables
Create a `.env` file in your backend directory:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/playmate_dev?schema=public"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"
```

### 5. Generate Prisma client
```bash
npx prisma generate
```

### 6. Run migrations
```bash
npx prisma migrate dev --name init
```

## Database Management Commands

### View your database in Prisma Studio
```bash
npm run prisma:studio
```

### Reset database (⚠️ WARNING: This will delete all data)
```bash
npm run db:reset
```

### Run new migrations
```bash
npm run prisma:migrate
```

### Generate Prisma client after schema changes
```bash
npm run prisma:generate
```

## Troubleshooting

### Connection Issues
1. **Check if PostgreSQL is running**
   ```bash
   # Windows
   net start postgresql
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. **Verify connection string format**
   - Format: `postgresql://username:password@host:port/database?schema=public`
   - Check username, password, host, port, and database name

3. **Test connection manually**
   ```bash
   psql -U username -h localhost -d database_name
   ```

### Permission Issues
1. **Check user permissions**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE playmate_dev TO username;
   ```

2. **Verify schema permissions**
   ```sql
   GRANT ALL ON SCHEMA public TO username;
   ```

### Migration Issues
1. **Reset migrations if needed**
   ```bash
   npm run db:reset
   ```

2. **Check migration status**
   ```bash
   npx prisma migrate status
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `NODE_ENV` | Application environment | `development` |

## Next Steps

After successful database setup:
1. Start your server: `npm run dev`
2. Test API endpoints
3. Use Prisma Studio to view/manage data: `npm run prisma:studio`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify PostgreSQL is running and accessible
3. Ensure your connection string is correct
4. Check Prisma documentation: [prisma.io](https://www.prisma.io/docs/)

# Play-Mate Backend API

A comprehensive backend API for the Play-Mate gaming platform, built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Team System**: Create teams, manage members, handle invitations
- **Tournament Management**: Organize and participate in tournaments
- **Real-time Communication**: Team and tournament messaging
- **Game Preferences**: Track user game preferences
- **Security**: JWT authentication, rate limiting, CORS protection
- **Validation**: Request validation using Zod schemas
- **Error Handling**: Comprehensive error handling and logging
- **Database**: PostgreSQL with Prisma ORM

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: tsx for hot reloading

## 📋 Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Git

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
# or
bun install
```

### 2. Environment Setup

Copy the environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/playmate_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Seed Database (Optional)

```bash
npm run db:seed
```

This creates sample data including:
- 5 games (CS2, Valorant, LoL, Dota 2, Rocket League)
- 4 users with password: `password123`
- 3 teams
- 2 tournaments
- Sample invitations and messages

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login

### User Management
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/:id/teams` - Get user's teams
- `GET /api/v1/users` - Get users with pagination
- `PUT /api/v1/users/change-password` - Change password
- `DELETE /api/v1/users/:id` - Delete user account

### Health Check
- `GET /health` - Server health status
- `GET /` - API information

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
│   ├── index.ts     # Main config
│   └── database.ts  # Database configuration
├── controllers/     # Request handlers
│   └── userController.ts
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication
│   ├── validation.ts # Request validation
│   └── errorHandler.ts # Error handling
├── models/          # Data models (Prisma handles this)
├── routes/          # API route definitions
│   └── userRoutes.ts
├── services/        # Business logic
│   └── userService.ts
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   ├── errors.ts    # Custom error classes
│   ├── logger.ts    # Logging utility
│   └── response.ts  # Response formatting
├── scripts/         # Utility scripts
│   └── seed.ts      # Database seeding
├── app.ts           # Express application setup
└── index.ts         # Server entry point
```

## 🔧 Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database

# Code quality
npm run lint           # ESLint
npm run format         # Prettier
npm test              # Run tests
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **CORS Protection**: Configurable cross-origin restrictions
- **Helmet**: Security headers and protection
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM protection

## 📊 Database Schema

The application uses a relational database with the following main entities:

- **Users**: User accounts and profiles
- **Games**: Available games
- **Teams**: User teams for specific games
- **TeamMembers**: Team membership with status
- **Tournaments**: Competitive events
- **TournamentTeams**: Team tournament registrations
- **Invitations**: Team invitations
- **Messages**: Team and tournament communication
- **UserGames**: User game preferences

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
```

### Build and Start

```bash
npm run build
npm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

need to be implemente



## 📝 API Documentation

### Request/Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔄 Changelog

### v1.0.0
- Initial release
- User management system
- Team and tournament functionality
- Comprehensive API endpoints
- Security and validation features

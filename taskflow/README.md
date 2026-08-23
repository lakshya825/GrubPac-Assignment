# TaskFlow - Enterprise Task Management API

TaskFlow is a robust, multi-tenant background task and project management backend API built for enterprise scale. 

## 🚀 Tech Stack
- **Node.js & Express** - Core web server
- **TypeScript** - Strict static typing for enterprise reliability
- **PostgreSQL & Prisma 7** - Relational database and modern ORM
- **Redis & BullMQ** - High-performance background job queueing
- **Jest** - Testing framework
- **Docker & Docker Compose** - Containerized environment

## ✨ Key Features Implemented

1. **Multi-Tenant Architecture**: All database queries and routes are strictly isolated by `organizationId`. A custom JWT middleware intercepts every request and scopes the queries to ensure users cannot access data belonging to other organizations.
2. **Advanced REST APIs**: The `Tasks` API supports robust filtering (by status, priority, and date range), full-text search, and both standard **Offset Pagination** and highly performant **Cursor-based Pagination**.
3. **Background Job Processing (BullMQ)**: Task assignment triggers an asynchronous mock email notification without blocking the API thread.
4. **Resiliency & Consistency**: The assignment and queueing processes are wrapped in a **Prisma Interactive Transaction** to guarantee data consistency. Jobs automatically utilize an **Exponential Backoff Strategy** (1s -> 2s -> 4s) with up to 3 retries, falling back to a dead-letter state upon exhaustion.
5. **Security**: `bcrypt` (work factor 12) is used for password hashing, and `express-rate-limit` secures the authentication endpoints against brute force attacks.
6. **Data Integrity**: Extensive use of PostgreSQL native enums and strict `onDelete: Cascade` foreign key rules to prevent orphaned data.

## 🐳 Quick Start (Docker)
The easiest way to review this project is using Docker Compose. It will automatically spin up the API, a separate Worker process, PostgreSQL, and Redis.

```bash
# 1. Clone the repository
git clone <your-repo>
cd sad

# 2. Start the Docker cluster (automatically migrates and seeds the DB!)
docker-compose up --build
```

## 💻 Manual Local Setup
If you prefer running it locally without Docker:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Copy the environment variables
cp .env.example .env

# 3. Apply the database migrations and seed the data
npx prisma migrate dev
npx prisma db seed

# 4. Start the development server
npm run dev
```

## 📚 API Documentation (Swagger)
Once the server is running, the interactive OpenAPI/Swagger documentation is available at:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

### Test Credentials
The database has been pre-seeded with sample data. You can authenticate using:
- **Email:** `user1@example.com`
- **Password:** `password123`

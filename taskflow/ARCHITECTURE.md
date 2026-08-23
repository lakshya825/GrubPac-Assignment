# System Architecture

## Overview
TaskFlow is a multi-tenant task management system designed to serve multiple organizations securely from a single database. The backend is built using Node.js, Express, and TypeScript, providing a scalable and strictly-typed environment.

## Key Technologies
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Queue / Background Jobs:** Redis + BullMQ
- **Authentication:** JWT (JSON Web Tokens) with `bcrypt` password hashing
- **Containerization:** Docker & Docker Compose

## Core Components
1. **API Server:** 
   The primary Express.js server handling all incoming HTTP requests. It validates inputs (using Zod schemas), checks authentication/authorization, interacts with the PostgreSQL database via Prisma, and queues background jobs.
2. **PostgreSQL Database:** 
   The central persistent data store. It uses a relational schema strictly linked through Foreign Keys (with `Cascade` deletions to prevent orphaned records).
3. **Redis:** 
   An in-memory data structure store acting as the message broker for BullMQ.
4. **Background Worker:** 
   A secondary, isolated Node.js process (running in its own Docker container) that continuously listens to the Redis queue. It processes asynchronous jobs (like email notifications) to ensure the main API remains fast and unblocked.

## Data Flow
1. **Authentication:** 
   Clients authenticate via `/auth/login` to receive a short-lived Access Token (15m) and a persistent, DB-backed Refresh Token (7d).
2. **Multi-Tenant Isolation:** 
   Every request to a protected route passes through the `auth.middleware.ts`. This middleware decodes the JWT, fetches the user's organization context, and attaches the `organizationId` directly to the `req` object.
3. **Query Execution:** 
   The Service Layer receives the `organizationId` from the Controller. Every single Prisma query enforces an explicit `where: { organizationId }` check. This completely prevents cross-tenant data leaks at the database query level.
4. **Asynchronous Background Jobs (Email Notification):**
   - A user assigns a task via `POST /tasks/:id/assign`.
   - The Controller calls the Task Service.
   - The Task Service wraps the database assignment update AND the BullMQ queue enqueue action inside a single **Prisma Interactive Transaction**.
   - If the Redis queue is unavailable, the transaction rolls back, ensuring the database is never left in an inconsistent state.
   - Upon successful transaction, the API immediately returns `201 Created` to the client.
   - The standalone Worker picks up the job from Redis, simulates sending the email, and gracefully handles retries with exponential backoff if mock failures occur.

## Design Decisions
- **Cursor Pagination vs Offset Pagination:** Task fetching supports both. Cursor pagination was implemented for highly efficient, scalable data fetching on large datasets without the performance degradation inherent to `OFFSET`.
- **Soft Deletes:** Deleting projects or tasks updates a `deletedAt` timestamp instead of hard-removing the record, preserving historical data integrity.
- **Transaction-bound Queueing:** Ensuring background jobs are tied to database transactions guarantees system consistency during partial failures.

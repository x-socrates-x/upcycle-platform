# Upcycle Platform – Backend API (CMP5387)

## Overview
This repository contains the backend API for the Upcycle Platform, developed as part of the CMP5387 Backend Web Services and Database Engineering module.

The system implements a RESTful API that supports:
- User authentication and role-based access control
- A marketplace workflow (requests → quotes → orders)
- Social interaction features (posts, comments, likes)
- Secure data persistence using PostgreSQL

The backend follows a client–server architecture and is designed to be consumed by a lightweight frontend client.

---

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Zod
- **Database Access:** pg
- **Development Tools:** nodemon

---

## Core Features
### Authentication & Security
- User login with JWT issuance
- Role-based access control (`customer`, `tailor`)
- Protected endpoints using middleware
- Proper HTTP status codes (401, 403, 409)

### Marketplace Workflow
- Customers create service requests
- Tailors submit quotes for open requests
- Customers accept quotes
- Orders are created atomically using transactions
- Tailors update order status

### Social Features
- Users can create posts
- Posts support comments and likes
- Like toggling and comment counts
- Role-agnostic social feed

---

## Database Structure
The database schema is fully normalised and enforces data integrity through:
- Primary and foreign keys
- Unique constraints (e.g. one quote per tailor per request)
- Check constraints for enumerated statuses

### Database Scripts
Located in the `/sql` directory:
- `schema.sql` – creates all database tables and constraints
- `seed.sql` – inserts demo data for testing and demonstration

---

## Setup Instructions

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL
- psql available in PATH

### Database Setup
```bash
psql -U upcycle_user -d upcycle_db -f sql/schema.sql
psql -U upcycle_user -d upcycle_db -f sql/seed.sql
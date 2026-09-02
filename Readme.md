# Savoria

A robust, modern Full-Stack Recipe Web Application built with the **MEAN Stack** (MongoDB, Express, Angular 17+ Standalone, Node.js). 

This project focuses on strict REST API design, robust database schemas, secure authentication, role-based access control, and a reactive Angular frontend.

---

## 📅 Development Progress

### ✅ Day 1: Setup & Data Layer (Completed)
- **Monorepo Architecture**: Clean separation of `client/` (Angular) and `server/` (Node.js/Express) within a single repository.
- **Database Connection**: Configured MongoDB Atlas connection using Mongoose, featuring graceful shutdown hooks (`SIGINT`, `SIGTERM`).
- **Robust Data Modeling**:
  - **User Schema**: Includes `name`, `email`, password hashing (via `bcrypt` pre-save hook), `role` (user/admin), and automatic password omission in JSON responses.
  - **Recipe Schema**: Includes ownership references, validation rules, descriptions, imagery, difficulty, tags, and a likes system.
  - **Search Optimization**: Implemented compound text indexes on recipe titles, ingredients, descriptions, and tags for powerful search queries.

### ✅ Day 2: Authentication (Completed)
- **Authentication Endpoints**: Implemented robust `/api/auth/register` and `/api/auth/login` routes.
- **Security & Hashing**: Verified user credentials securely using `bcrypt` comparison.
- **JWT Implementation**: 
  - Signed JSON Web Tokens upon successful login with a 7-day expiry.
  - Built custom `protect` middleware to intercept requests and verify JWT integrity.
  - Strictly enforcing `401 Unauthorized` for missing, bad, or expired tokens.
- **Session Management**: Implemented `GET /api/auth/me` to safely retrieve the current logged-in user profile from the token payload.

### ✅ Day 3: CRUD, Validation & Authorization (Completed)
- **RESTful Recipe API**: Implemented full CRUD (`GET`, `POST`, `PUT`, `DELETE`) endpoints for recipes.
- **Strict Input Validation**: Utilized `express-validator` to enforce rules on every input field before processing requests.
- **Role-Based Authorization**:
  - Ensured only the original `owner` of a recipe can edit or delete it.
  - Implemented an `admin` role override for global moderation.
- **Status Code Discipline**: Explicit separation between `401 Unauthorized` (auth failure) and `403 Forbidden` (permission failure).
- **Global Error Handling**: Centralized error middleware to catch and format API errors and `404 Not Found` routes consistently.

### ✅ Day 4: API Hardening & Tests (Completed)
- **Advanced Querying**: Implemented pagination, category filtering, and full-text search directly via API query parameters.
- **API Hardening**: 
  - Secured HTTP headers using `helmet`.
  - Configured strict environment-based `CORS` origins.
  - Implemented global endpoint rate-limiting using `express-rate-limit` to prevent abuse.
- **Automated Testing**: Built an integration test suite using `Jest` and `Supertest` covering request validation, authentication tokens, and deep RBAC permission checks.
- **Data Seeding**: Created an automated database seed script for generating test users, admins, and sample recipes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Angular CLI (`npm i -g @angular/cli`)
- MongoDB Atlas URI

### Running the Server
```bash
cd server
npm install
npm run dev
```

### Running the Client
```bash
cd client
npm install
npm start
```

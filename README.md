# REST API v1.0.0

A Node.js REST API with JWT authentication, refresh token rotation, MySQL database support, Swagger documentation, and enhanced security.

## What's new in v1.0.0
- **Add testing and security dependencies to package.json**
  - Added `jest` and `supertest` as devDependencies for testing.
  - Included `express-basic-auth` for basic authentication.
  - Added `helmet` for security enhancements.
  - Updated dependencies for `sanitize-html`, `swagger-jsdoc`, and `swagger-ui-express`.
- **Swagger documentation** for all endpoints (`/api-docs`)
- **Endpoint for listing rent posts** (`GET /api/rentposts`)
- **Sanitization of user input** using `sanitize-html` middleware
- **Improved error handling** and consistent JSON responses
- **Comprehensive test coverage** for services, middleware, and controllers

## Features
- User registration and login
- JWT access and refresh tokens
- Refresh token storage and rotation
- Token revocation and logout (per session)
- MySQL database integration
- Cookie-based authentication
- Profile management (get, update, change password)
- Middleware-based route protection
- OTP email verification and resend
- Admin endpoints for user and feature management
- Swagger (OpenAPI 3.0) documentation (`/api-docs`)
- Security headers via `helmet`
- Basic Auth for `/api-docs`
- Input sanitization with `sanitize-html`
- Endpoint for listing rent posts (`GET /api/rentposts`)

## Getting Started

1. **Clone the repository and install dependencies:**
   ```sh
   git clone https://github.com/kr4sy/Simple-Auth-Api.git
   cd paktyki_backend/rest_api
   npm install
   ```

2. **Configure your MySQL database:**
   - Create a database and user with appropriate privileges.
   - Import the provided SQL schema (see `db/schema.sql` if available).
   - Update your database credentials in `config/.env`:
     ```env
    DB_HOST=localhost
    DB_USER=youruser
    DB_PASSWORD=yourpassword
    DB_NAME=yourdatabase
    ACCESS_TOKEN_SECRET=yoursecret
    ACCESS_TOKEN_EXPIRATION=time
    REFRESH_TOKEN_SECRET=yoursecret
    REFRESH_TOKEN_EXPIRATION=time
    EMAIL_USER=yourmail
    EMAIL_PASS=yourmailpass
     ```

3. **Start the API server:**
   ```sh
   node api/index.js
   ```

4. **Access Swagger documentation:**
   - Go to [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (login: `admin`, password: `xdlol`)

5. **Run tests:**
   ```sh
   npm test
   ```

6. **(Optional) Run the cleanup script for expired tokens:**
   ```sh
   npm run cleanup-tokens
   ```

## Endpoints (selected)

- `POST /api/register` — User registration
- `POST /api/login` — User login
- `POST /api/refresh-token` — Refresh access token
- `POST /api/logout` — Logout and revoke current refresh token
- `GET /api/profile` — Get user profile (requires JWT)
- `PUT /api/profile` — Update user profile (requires JWT)
- `PUT /api/profile/password` — Change password (requires JWT)
- `POST /api/verify-otp` — Verify OTP code
- `POST /api/resend-otp` — Resend OTP code
- `GET /api/rentposts` — **List all rent posts**
- Admin endpoints: `/api/admin/features`, `/api/admin/admins`, `/api/admin/users`, etc.

## Project Structure

- `api/` — Main API code (Express app, routes, controllers, services, middleware)
- `api/routes/` — Route definitions (with Swagger comments)
- `api/controllers/` — Request handlers
- `api/services/` — Business logic and DB queries
- `api/middleware/` — Custom middleware (auth, admin, sanitize)
- `api/swagger.js` — Swagger/OpenAPI config
- `api/app.js` — Express app setup
- `api/index.js` — Server entry point
- `scripts/cleanupTokens.js` — Script for cleaning up expired refresh tokens
- `api/controllers/__tests__/` — Controller tests (Supertest)
- `api/services/__tests__/` — Service tests (unit)
- `api/middleware/__tests__/` — Middleware tests

## Notes
- All dependencies are listed in `package.json` (including `express`, `mysql2`, `dotenv`, `cors`, `jsonwebtoken`, `cookie-parser`, `bcrypt`, `sanitize-html`, `swagger-jsdoc`, `swagger-ui-express`, `helmet`, `express-basic-auth`, `jest`, `supertest`).
- See Swagger UI (`/api-docs`) for full API documentation and request/response schemas.
- For production, secure your `.env` and database credentials.
- To import all endpoints to Postman, download `/api-docs.json` and import as OpenAPI 3.0 in Postman.

---
This is version v1.0.0 — stable for development and testing.


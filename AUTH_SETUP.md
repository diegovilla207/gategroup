# Authentication System Setup Guide

## SmartStation - Role-Based Login System

This guide explains how to set up and run SmartStation locally, including optional Snowflake integration.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Installation Steps](#installation-steps)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Testing the System](#testing-the-system)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

This authentication system provides:

- **Secure login** with JWT tokens and HTTP-only cookies
- **Role-based access control** (Employee vs Supervisor)
- **Snowflake database integration** for user storage
- **Protected routes** that require authentication
- **Supervisor dashboard** with metrics and analytics
- **Password hashing** using bcrypt
- **Token expiration** (24 hours)

### User Roles

1. **Employee**

   - Access to Bottle Analysis
   - Access to Inventory Manager

2. **Supervisor** (All employee features plus:)
   - Analytics Dashboard with:
     - Productivity metrics per employee
     - Error rate analysis
     - Overall line efficiency
     - Performance insights

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **Python 3** (v3.8 or higher)
- **npm** or **yarn**
- **Snowflake account** (optional) with credentials if you plan to use Snowflake

---

## Project Structure

```
gategroup-1/
├── backend/
│   ├── config/
│   │   └── snowflake.js          # Snowflake connection utilities
│   ├── models/
│   │   ├── User.js                # User model for authentication
│   │   └── Metrics.js             # Metrics model for dashboard
│   ├── utils/
│   │   └── auth.js                # JWT utilities and middleware
│   ├── scripts/
│   │   └── init_database.py       # Database initialization script
│   ├── .env                       # Environment variables (Snowflake credentials)
│   ├── server.js                  # Express server with auth endpoints
│   └── package.json
│
└── gategroup/
    └── src/
        ├── context/
        │   └── AuthContext.jsx    # React authentication context
        ├── components/
        │   └── ProtectedRoute.jsx # Protected route wrapper
        ├── pages/
        │   ├── Login.jsx          # Login page
        │   ├── HomePage.jsx       # Home page (role-based)
        │   └── SupervisorDashboard.jsx  # Supervisor analytics
        ├── App.jsx                # Main app with routes
        └── main.jsx
```

---

## Installation Steps

### 1. Install Backend Dependencies

```powershell
cd backend; npm install
```

This will install the backend dependencies used by SmartStation (Express, CORS, dotenv, Snowflake SDK, bcrypt, jsonwebtoken, cookie-parser).

### 2. Install Python Dependencies

```powershell
pip install snowflake-connector-python python-dotenv bcrypt
```

### 3. Install Frontend Dependencies

```powershell
cd ..\gategroup; npm install
```

---

## Database Setup

### 1. Configure Snowflake Credentials

Create a `backend/.env` file with your Snowflake credentials and a JWT secret. Never commit this file to source control.

Example `.env` (replace values):

```env
SNOWFLAKE_USER="your_user"
SNOWFLAKE_PASSWORD="your_password"
SNOWFLAKE_ACCOUNT="your_account"
SNOWFLAKE_WAREHOUSE="COMPUTE_WH"
SNOWFLAKE_DATABASE="LOGIN_DB"
SNOWFLAKE_SCHEMA="MAIN"

JWT_SECRET="change_this_to_a_strong_random_value"
```

### 2. Initialize the Database

Run the initialization script to create tables and insert demo users:

```powershell
cd backend; python3 scripts/init_database.py
```

This script will:

- Create the `USERS` table
- Create the `DRAWER_COMPLETIONS` table (for productivity metrics)
- Create the `INVENTORY_SCANS` table (for error tracking)
- Insert 5 demo users with hashed passwords
- Insert sample metrics data

#### Database Schema

**USERS Table:**

```sql
USER_ID          INTEGER (Primary Key, Auto-increment)
USERNAME         VARCHAR(50) UNIQUE
PASSWORD_HASH    VARCHAR(255)
ROLE             VARCHAR(20)  -- 'employee' or 'supervisor'
FULL_NAME        VARCHAR(100)
EMAIL            VARCHAR(100)
CREATED_AT       TIMESTAMP
UPDATED_AT       TIMESTAMP
```

**DRAWER_COMPLETIONS Table:**

```sql
DRAWER_ID        INTEGER (Primary Key)
USER_ID          INTEGER (Foreign Key -> USERS)
START_TIME       TIMESTAMP
END_TIME         TIMESTAMP
COMPLETION_DATE  DATE
ITEMS_COUNT      INTEGER
```

**INVENTORY_SCANS Table:**

```sql
SCAN_ID          INTEGER (Primary Key)
USER_ID          INTEGER (Foreign Key -> USERS)
ITEM_ID          VARCHAR(50)
STATUS           VARCHAR(20)  -- 'success' or 'error'
SCAN_TIME        TIMESTAMP
```

---

## Running the Application

### 1. Start the Backend Server

```powershell
cd backend; npm start
```

Development (with auto-restart if available):

```powershell
cd backend; npm run dev
```

The backend listens on http://localhost:3001 by default.

### 2. Start the Frontend Server

In a new terminal:

```powershell
cd gategroup; npm run dev
```

Frontend default: http://localhost:5173

### 3. Access the Application

Open your browser and navigate to: http://localhost:5173

---

## Testing the System

### Demo User Credentials

| Username       | Password    | Role       |
| -------------- | ----------- | ---------- |
| supervisor     | password123 | supervisor |
| employee       | password123 | employee   |
| jane_smith     | password123 | employee   |
| bob_johnson    | password123 | employee   |
| alice_williams | password123 | employee   |

### Test Scenarios

#### 1. Employee Login Flow

1. Navigate to **http://localhost:5173**
2. Login with: `employee` / `password123`
3. You should see the home page with:
   - Smart Bottle Analyzer option
   - Inventory Manager option
   - **No Analytics Dashboard** (employee doesn't have access)
4. Click on Smart Bottle Analyzer or Inventory
5. Try accessing `/dashboard` directly - you should be redirected to `/home`

#### 2. Supervisor Login Flow

1. Logout from employee account
2. Login with: `supervisor` / `password123`
3. You should see the home page with:
   - Smart Bottle Analyzer option
   - Inventory Manager option
   - **Analytics Dashboard** option (purple card - supervisor only)
4. Click on Analytics Dashboard
5. You should see:
   - Overall line efficiency metrics
   - Employee productivity table
   - Error rate analysis table
   - Insights and recommendations

#### 3. Protected Route Testing

1. Logout from the application
2. Try accessing these URLs directly:
   - `http://localhost:5173/home` → Should redirect to login
   - `http://localhost:5173/smart-bottle` → Should redirect to login
   - `http://localhost:5173/dashboard` → Should redirect to login

#### 4. API Testing (example using curl on PowerShell)

Login:

```powershell
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"supervisor","password":"password123"}' -c cookies.txt
```

Get current user:

```powershell
curl http://localhost:3001/api/auth/me -b cookies.txt
```

Supervisor metrics:

```powershell
curl http://localhost:3001/api/metrics/dashboard -b cookies.txt
```

---

### Security Best Practices

✅ Implemented (high level): password hashing (bcrypt), JWT tokens with 24h expiry, HTTP-only cookies, CORS config, role-based middleware, and parameterized queries.

Recommended for production:

- Replace `JWT_SECRET` with a strong random value
- Run behind HTTPS and set secure cookies
- Implement rate limiting and input validation
- Add audit logging and monitoring

### Example Production .env

```env
# Production environment variables
NODE_ENV=production

# Snowflake
SNOWFLAKE_USER="your_snowflake_user"
SNOWFLAKE_PASSWORD="your_strong_password"
SNOWFLAKE_ACCOUNT="your_account"
SNOWFLAKE_WAREHOUSE="COMPUTE_WH"
SNOWFLAKE_DATABASE="LOGIN_DB"
SNOWFLAKE_SCHEMA="MAIN"

# JWT - Use a strong random secret (at least 64 characters)
JWT_SECRET="your_very_long_and_random_secret_key_here_at_least_64_characters_long"
```

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Troubleshooting

### Issue: "Cannot connect to Snowflake"

**Solution:**

1. Verify your `.env` credentials are correct
2. Check your Snowflake account status
3. Ensure your IP is whitelisted in Snowflake
4. Test connection with:
   ```bash
   cd backend
   node -e "import('./config/snowflake.js').then(m => m.testConnection())"
   ```

### Issue: "User not found" or "Invalid credentials"

**Solution:**

1. Make sure you ran the database initialization script:
   ```bash
   python3 scripts/init_database.py
   ```
2. Verify users exist in Snowflake:
   ```sql
   SELECT * FROM USERS;
   ```

### Issue: "CORS error" in browser console

**Solution:**

1. Ensure backend is running on port 3001
2. Ensure frontend is running on port 5173
3. Check CORS configuration in `server.js`:
   ```javascript
   app.use(
     cors({
       origin: "http://localhost:5173",
       credentials: true,
     })
   );
   ```

### Issue: "Token expired" or "Authentication failed"

**Solution:**

1. Logout and login again
2. Clear browser cookies
3. Check if backend server is running
4. Verify JWT_SECRET is set in `.env`

### Issue: Protected routes not working

**Solution:**

1. Check browser console for errors
2. Verify AuthProvider wraps the entire app in `App.jsx`
3. Check that cookies are being sent (Network tab → Headers)
4. Ensure `credentials: 'include'` is set in fetch requests

### Issue: Supervisor dashboard shows no data

**Solution:**

1. The system uses mock data if real data isn't available
2. Run the database initialization script to populate sample data
3. Check backend logs for Snowflake query errors

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login

Login user and return JWT token.

**Request:**

```json
{
  "username": "supervisor",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "supervisor",
    "role": "supervisor",
    "fullName": "Sarah Johnson",
    "email": "supervisor@gategroup.com"
  }
}
```

#### POST /api/auth/logout

Logout user and clear cookies.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me

Get current user information (requires authentication).

**Response:**

```json
{
  "user": {
    "id": 1,
    "username": "supervisor",
    "role": "supervisor",
    "fullName": "Sarah Johnson",
    "email": "supervisor@gategroup.com"
  }
}
```

### Metrics Endpoints (Supervisor Only)

#### GET /api/metrics/dashboard

Get complete dashboard data.

**Response:**

```json
{
  "productivity": [...],
  "errorRates": [...],
  "efficiency": {...},
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

#### GET /api/metrics/productivity

Get productivity metrics per employee.

#### GET /api/metrics/error-rates

Get error rates per employee.

#### GET /api/metrics/efficiency

Get overall line efficiency.

---

## Next Steps

1. **Customize User Roles**: Add more roles (e.g., manager, admin)
2. **Enhanced Metrics**: Connect real data sources for metrics
3. **User Management**: Add user creation/editing interface for supervisors
4. **Password Reset**: Implement forgot password functionality
5. **Email Verification**: Add email verification on signup
6. **Multi-Factor Authentication**: Add 2FA for enhanced security
7. **Audit Logs**: Track all user actions for compliance

---

## Support

For issues or questions:

- Check the Troubleshooting section above
- Review backend logs in the terminal
- Check browser console for frontend errors
- Verify Snowflake connection and queries

---

## License

GateGroup SmartStation - HackMTY 2025

---

**Created with Claude Code** 🤖

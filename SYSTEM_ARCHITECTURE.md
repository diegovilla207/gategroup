# System Architecture - SmartStation

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (Browser)                        │
│                      http://localhost:5173 (Vite)                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │   PUBLIC ROUTES     │   │  PROTECTED ROUTES  │
         │                     │   │                    │
         │  /  (Login)         │   │  /home             │
         │                     │   │  /smart-bottle     │
         └─────────────────────┘   │  /inventory        │
                                   │  /dashboard *      │
                                   │  (* supervisor)    │
                                   └──────────┬─────────┘
                                              │
                         ┌────────────────────▼────────────────────┐
                         │     AUTHENTICATION CONTEXT              │
                         │  - User State Management                │
                         │  - Login/Logout Functions               │
                         │  - Role Checking                        │
                         │  - Token Storage (HTTP-only cookies)    │
                         └────────────────────┬────────────────────┘
                                              │
                         ┌────────────────────▼────────────────────┐
                         │      BACKEND API SERVER                 │
                         │   http://localhost:3001 (Express)       │
                         └────────────────────┬────────────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              │                               │                               │
    ┌─────────▼──────────┐        ┌──────────▼───────────┐      ┌───────────▼──────────┐
    │   AUTH ENDPOINTS   │        │  METRICS ENDPOINTS   │      │ INVENTORY ENDPOINTS  │
    │                    │        │   (Supervisor Only)  │      │                      │
    │  POST /auth/login  │        │ GET /metrics/        │      │ POST /inventory/     │
    │  POST /auth/logout │        │     dashboard        │      │      flight          │
    │  GET  /auth/me     │        │ GET /metrics/        │      │ POST /inventory/     │
    │                    │        │     productivity     │      │      validate        │
    └─────────┬──────────┘        │ GET /metrics/        │      └──────────────────────┘
              │                   │     error-rates      │
              │                   │ GET /metrics/        │
              │                   │     efficiency       │
              │                   └──────────┬───────────┘
              │                              │
              └───────────────┬──────────────┘
                              │
           ┌──────────────────▼──────────────────┐
           │      MIDDLEWARE LAYER               │
           │  - authenticateToken                │
           │  - requireRole                      │
           │  - requireSupervisor                │
           │  - CORS                             │
           │  - Cookie Parser                    │
           └──────────────────┬──────────────────┘
                              │
           ┌──────────────────▼──────────────────┐
           │       DATA MODELS                   │
           │  - User Model (auth, CRUD)          │
           │  - Metrics Model (analytics)        │
           └──────────────────┬──────────────────┘
                              │
           ┌──────────────────▼──────────────────┐
           │  SNOWFLAKE CONNECTION               │
           │  - Connection Pool                  │
           │  - Query Execution                  │
           │  - Error Handling                   │
           └──────────────────┬──────────────────┘
                              │
           ┌──────────────────▼──────────────────┐
           │      SNOWFLAKE DATABASE (configurable)
           │                                     │
           │  Tables:                            │
           │  - USERS                            │
           │  - DRAWER_COMPLETIONS               │
           │  - INVENTORY_SCANS                  │
           └─────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────┐                                                    ┌──────────┐
│  USER   │                                                    │  SYSTEM  │
└────┬────┘                                                    └─────┬────┘
     │                                                               │
     │  1. Navigate to app (/)                                      │
     │ ─────────────────────────────────────────────────────────>   │
     │                                                               │
     │  2. Show Login Page                                          │
     │ <─────────────────────────────────────────────────────────   │
     │                                                               │
     │  3. Enter credentials & submit                               │
     │ ─────────────────────────────────────────────────────────>   │
     │                                                               │
     │                                     4. Validate credentials  │
     │                                        against Snowflake DB  │
     │                                               ┌───────┐      │
     │                                               │  DB   │      │
     │                                               └───┬───┘      │
     │                                                   │          │
     │                                     5. Hash password & compare
     │                                                   │          │
     │                                     6. Generate JWT token    │
     │                                                   │          │
     │  7. Set HTTP-only cookie + return user data                 │
     │ <─────────────────────────────────────────────────────────   │
     │                                                               │
     │  8. Store user in AuthContext                                │
     │     Redirect to /home                                        │
     │ ─────────────────────────────────────────────────────────>   │
     │                                                               │
     │  9. Show HomePage with role-based menu                       │
     │ <─────────────────────────────────────────────────────────   │
     │                                                               │
     │  10. Access protected route                                  │
     │ ─────────────────────────────────────────────────────────>   │
     │                                                               │
     │                                    11. Check JWT in cookie   │
     │                                        Verify token           │
     │                                        Check role if needed  │
     │                                                               │
     │  12. Return protected data / Deny access                     │
     │ <─────────────────────────────────────────────────────────   │
     │                                                               │
```

## Role-Based Access Control

```
                            ┌─────────────┐
                            │    USER     │
                            └──────┬──────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
             ┌──────▼──────┐             ┌───────▼────────┐
             │  EMPLOYEE   │             │  SUPERVISOR    │
             └──────┬──────┘             └───────┬────────┘
                    │                            │
        ┌───────────┴───────────┐                │
        │                       │                │
   ┌────▼─────┐         ┌──────▼──────┐    ┌────▼─────────────────┐
   │  Bottle  │         │  Inventory  │    │  All Employee        │
   │ Analysis │         │   Manager   │    │  Features            │
   └──────────┘         └─────────────┘    │       +              │
                                            │  Supervisor          │
                                            │  Dashboard           │
                                            └──────────────────────┘
```

## Component Hierarchy

```
App.jsx
├─ <AuthProvider>
│  └─ <Router>
│     ├─ / (Public)
│     │  └─ <Login />
│     │
│     └─ Protected Routes
│        ├─ /home
│        │  └─ <ProtectedRoute>
│        │     └─ <HomePage />
│        │        ├─ User Info
│        │        ├─ Logout Button
│        │        ├─ Bottle Analyzer Button
│        │        ├─ Inventory Button
│        │        └─ Dashboard Button (if supervisor)
│        │
│        ├─ /smart-bottle
│        │  └─ <ProtectedRoute>
│        │     └─ <SmartBottleAnalyzer />
│        │
│        ├─ /inventory
│        │  └─ <ProtectedRoute>
│        │     └─ <Inventory />
│        │
│        └─ /dashboard
│           └─ <ProtectedRoute requiredRole="supervisor">
│              └─ <SupervisorDashboard />
│                 ├─ Overall Efficiency Metrics
│                 ├─ Productivity Table
│                 ├─ Error Rate Table
│                 └─ Insights & Recommendations
```

## Data Flow - Supervisor Dashboard

```
┌──────────────────┐
│  Supervisor      │
│  Dashboard Page  │
└────────┬─────────┘
         │
         │ useEffect() on mount
         │
         ▼
    Fetch Dashboard Data
         │
         │ GET /api/metrics/dashboard
         │ (with credentials: 'include')
         │
         ▼
┌────────────────────┐
│  Backend Server    │
│                    │
│  1. authenticateToken()
│     - Check cookie  │
│     - Verify JWT    │
│                    │
│  2. requireSupervisor()
│     - Check role    │
│                    │
└────────┬───────────┘
         │
         │ Parallel queries
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
  Prod  Err  Eff
  Data  Rate Data
    │    │    │
    └────┼────┘
         │
         ▼
┌────────────────────┐
│  Snowflake DB      │
│                    │
│  - USERS           │
│  - DRAWER_         │
│    COMPLETIONS     │
│  - INVENTORY_      │
│    SCANS           │
└────────┬───────────┘
         │
         │ Aggregated Results
         │
         ▼
┌────────────────────┐
│  Response JSON     │
│  {                 │
│   productivity: [] │
│   errorRates: []   │
│   efficiency: {}   │
│  }                 │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Dashboard UI      │
│                    │
│  - Metric Cards    │
│  - Data Tables     │
│  - Performance     │
│    Badges          │
│  - Insights        │
└────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                     LAYER 1: TRANSPORT                  │
│  - HTTPS in production                                  │
│  - Secure cookies (httpOnly, sameSite, secure)          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     LAYER 2: AUTHENTICATION             │
│  - JWT tokens with expiration                           │
│  - Password hashing (bcrypt, 10 rounds)                 │
│  - Token verification middleware                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     LAYER 3: AUTHORIZATION              │
│  - Role-based access control                            │
│  - Protected route components                           │
│  - requireRole middleware                               │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     LAYER 4: DATA ACCESS                │
│  - Parameterized queries (no SQL injection)             │
│  - Database user permissions                            │
│  - Input validation                                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     LAYER 5: INFRASTRUCTURE             │
│  - Environment variables for secrets                    │
│  - CORS configuration                                   │
│  - Error handling (no sensitive data in errors)         │
└─────────────────────────────────────────────────────────┘
```

## Database Relations

```
┌─────────────────────────────────────────┐
│              USERS                      │
├──────────────┬──────────────────────────┤
│ USER_ID (PK) │ INTEGER AUTO_INCREMENT   │
│ USERNAME     │ VARCHAR(50) UNIQUE       │
│ PASSWORD_HASH│ VARCHAR(255)             │
│ ROLE         │ VARCHAR(20)              │
│ FULL_NAME    │ VARCHAR(100)             │
│ EMAIL        │ VARCHAR(100)             │
│ CREATED_AT   │ TIMESTAMP                │
│ UPDATED_AT   │ TIMESTAMP                │
└──────────────┴──────────────────────────┘
       │                         │
       │ 1:N                     │ 1:N
       │                         │
┌──────▼──────────────┐   ┌──────▼─────────────┐
│ DRAWER_COMPLETIONS  │   │ INVENTORY_SCANS    │
├─────────────────────┤   ├────────────────────┤
│ DRAWER_ID (PK)      │   │ SCAN_ID (PK)       │
│ USER_ID (FK)        │   │ USER_ID (FK)       │
│ START_TIME          │   │ ITEM_ID            │
│ END_TIME            │   │ STATUS             │
│ COMPLETION_DATE     │   │ SCAN_TIME          │
│ ITEMS_COUNT         │   └────────────────────┘
└─────────────────────┘
         │
         │ Used for
         ▼
┌─────────────────────┐
│ Productivity        │
│ Calculations:       │
│                     │
│ Drawers/Hour =      │
│   COUNT(drawers) /  │
│   SUM(hours)        │
└─────────────────────┘
```

## Session Management

```
Login Event
     │
     ▼
┌──────────────────────┐
│ Generate JWT Token   │
│ - user.id            │
│ - user.username      │
│ - user.role          │
│ - exp: 24h           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Set HTTP-Only Cookie │
│ - httpOnly: true     │
│ - secure: prod only  │
│ - sameSite: strict   │
│ - maxAge: 24h        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Store User in        │
│ AuthContext          │
│ - Available globally │
│ - Re-check on reload │
└──────────────────────┘
```

## Deployment Checklist

```
☐ Development
  ├─ ✅ Install dependencies
  ├─ ✅ Configure .env
  ├─ ✅ Initialize database
  ├─ ✅ Start backend server
  └─ ✅ Start frontend server

☐ Testing
  ├─ ✅ Test login flow
  ├─ ✅ Test protected routes
  ├─ ✅ Test role-based access
  ├─ ✅ Test logout
  └─ ✅ Test token expiration

☐ Security
  ├─ ☐ Change JWT_SECRET
  ├─ ☐ Enable HTTPS
  ├─ ☐ Set secure cookies
  ├─ ☐ Implement rate limiting
  ├─ ☐ Add input validation
  └─ ☐ Set up monitoring

☐ Production
  ├─ ☐ Deploy backend
  ├─ ☐ Deploy frontend
  ├─ ☐ Configure DNS
  ├─ ☐ Set up SSL
  ├─ ☐ Configure firewall
  └─ ☐ Set up backups
```

---

## Technology Stack

### Frontend

- **Framework**: React 19.1.1
- **Routing**: React Router DOM 7.9.4
- **Styling**: Tailwind CSS 3.4.18
- **Build Tool**: Vite 7.1.7
- **State Management**: React Context API

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Authentication**: JWT (jsonwebtoken 9.x)
- **Password Hashing**: bcryptjs 2.x
- **Database Driver**: snowflake-sdk 1.x
- **CORS**: cors 2.8.5

### Database

- **Database**: Snowflake
- **Account**: cucbppa-am55842
- **Database**: LOGIN_DB
- **Schema**: MAIN

### Development Tools

- **Python**: 3.8+ (for DB initialization)
- **Package Manager**: npm
- **Version Control**: Git

---

This architecture provides a scalable, secure, and maintainable authentication system for the GateGroup SmartStation application.

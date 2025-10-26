# GateGroup SmartStation - Authentication System

## Complete Role-Based Login & Dashboard System

This repository now includes a **fully functional authentication system** with Snowflake database integration, role-based access control, and a supervisor analytics dashboard.

---

## Quick Links

- 📖 [Quick Start Guide](QUICKSTART.md) - Get running in 5 minutes
- 📚 [Complete Setup Documentation](AUTH_SETUP.md) - Detailed installation & configuration
- 🏗️ [System Architecture](SYSTEM_ARCHITECTURE.md) - Technical diagrams & flow charts
- 📋 [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Complete file listing & changes
- 🔧 [Backend Documentation](backend/README.md) - API reference & development guide

---

## Features

### 🔐 Authentication & Security

- ✅ Secure JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ HTTP-only cookies for token storage
- ✅ Role-based access control (Employee/Supervisor)
- ✅ Protected routes on frontend
- ✅ 24-hour token expiration
- ✅ CORS configuration
- ✅ SQL injection prevention

### 👥 User Roles

**Employee:**

- Access to Bottle Analysis
- Access to Inventory Manager

**Supervisor:**

- All employee features
- **Analytics Dashboard** with:
  - Productivity metrics per employee
  - Error rate analysis
  - Overall line efficiency
  - Performance insights & recommendations

### 📊 Supervisor Dashboard

- Real-time team performance metrics
- Employee productivity tracking (drawers/hour)
- Error rate monitoring
- Performance badges (Excellent/Good/Needs Training)
- Actionable insights for team management
- Identify training needs
- Balance workloads
- Recognize high performers

---

## Demo Credentials

| Username     | Password      | Role       | Access                      |
| ------------ | ------------- | ---------- | --------------------------- |
| `supervisor` | `password123` | Supervisor | All features + Dashboard    |
| `employee`   | `password123` | Employee   | Bottle Analysis + Inventory |

---

## Installation

### 1. Install Dependencies

````bash
# Backend
cd backend
npm install
pip install snowflake-connector-python python-dotenv bcrypt

# Frontend
cd ../gategroup
npm install
# SmartStation - Authentication System

## Complete Role-Based Login & Dashboard System

SmartStation includes a full authentication system with Snowflake integration, role-based access control, and a supervisor analytics dashboard.

---

## Quick Links

- 📖 [Quick Start Guide](QUICKSTART.md) - Get running in 5 minutes
- 📚 [Complete Setup Documentation](AUTH_SETUP.md) - Detailed installation & configuration
- 🏗️ [System Architecture](SYSTEM_ARCHITECTURE.md) - Technical diagrams & flow charts
- 📋 [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Complete file listing & changes
- 🔧 [Backend Documentation](backend/README.md) - API reference & development guide

---

## Features

### 🔐 Authentication & Security
- ✅ Secure JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ HTTP-only cookies for token storage
- ✅ Role-based access control (Employee/Supervisor)
- ✅ Protected routes on frontend
- ✅ 24-hour token expiration
- ✅ CORS configuration
- ✅ SQL injection prevention

### 👥 User Roles

**Employee:**
- Access to Bottle Analysis
- Access to Inventory Manager

**Supervisor:**
- All employee features
- **Analytics Dashboard** with:
  - Productivity metrics per employee
  - Error rate analysis
  - Overall line efficiency
  - Performance insights & recommendations

### 📊 Supervisor Dashboard
- Real-time team performance metrics
- Employee productivity tracking (drawers/hour)
- Error rate monitoring
- Performance badges (Excellent/Good/Needs Training)
- Actionable insights for team management
- Identify training needs
- Balance workloads
- Recognize high performers

---

## Demo Credentials

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `supervisor` | `password123` | Supervisor | All features + Dashboard |
| `employee` | `password123` | Employee | Bottle Analysis + Inventory |

---

## Installation

### 1. Install Dependencies

```powershell
# Backend
cd backend; npm install
pip install snowflake-connector-python python-dotenv bcrypt

# Frontend
cd ..\gategroup; npm install
````

### 2. Initialize Database

```powershell
cd backend; python3 scripts/init_database.py
```

### 3. Start Servers

Backend (Terminal 1):

```powershell
cd backend; npm start
```

Frontend (Terminal 2):

```powershell
cd gategroup; npm run dev
```

### 4. Access Application

Open browser: **http://localhost:5173**

---

## Project Structure

```
gategroup-1/
│
├── backend/
│   ├── config/
│   │   └── snowflake.js              # Database connection
│   ├── models/
│   │   ├── User.js                   # User authentication
│   │   └── Metrics.js                # Analytics data
│   ├── utils/
│   │   └── auth.js                   # JWT middleware
│   ├── scripts/
│   │   ├── init_database.py          # DB setup
│   │   └── test_auth.sh              # Test script
│   ├── .env                          # Environment vars
│   └── server.js                     # Express server
│
├── gategroup/src/
│   ├── context/
│   │   └── AuthContext.jsx           # Auth state
│   ├── components/
│   │   └── ProtectedRoute.jsx        # Route protection
│   ├── pages/
│   │   ├── Login.jsx                 # Login page
│   │   ├── HomePage.jsx              # Home (role-based)
│   │   └── SupervisorDashboard.jsx   # Analytics
│   └── App.jsx                       # Main app
│
└── Documentation/
    ├── AUTH_SETUP.md                 # Complete guide
    ├── QUICKSTART.md                 # Quick setup
    ├── SYSTEM_ARCHITECTURE.md        # Technical docs
    ├── IMPLEMENTATION_SUMMARY.md     # Changes list
    └── README_AUTH.md                # This file
```

---

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user (protected)

### Metrics (Supervisor Only)

- `GET /api/metrics/dashboard` - Complete dashboard
- `GET /api/metrics/productivity` - Productivity data
- `GET /api/metrics/error-rates` - Error rate data
- `GET /api/metrics/efficiency` - Efficiency data

### Inventory

- `POST /api/inventory/flight` - Get flight inventory
- `POST /api/inventory/validate` - Validate inventory

### System

- `GET /api/health` - Health check

---

## Technology Stack

### Frontend

- React 19.1 + Vite 7.1
- React Router DOM 7.9
- Tailwind CSS 3.4
- Context API for state

### Backend

- Node.js + Express 4.18
- JWT authentication
- bcrypt password hashing
- Snowflake SDK

### Database

- Snowflake Cloud Database
- Tables: USERS, DRAWER_COMPLETIONS, INVENTORY_SCANS

---

## Testing

### Manual Testing

1. Login with employee account
2. Verify access to Bottle Analysis & Inventory
3. Verify NO access to Dashboard
4. Logout and login with supervisor
5. Verify access to Dashboard
6. Check metrics display correctly

### Automated Testing

```powershell
cd backend; ./scripts/test_auth.sh
```

This tests:

- Health check
- Supervisor login
- User info retrieval
- Dashboard access
- Logout
- Unauthenticated requests
- Employee login
- Role-based restrictions

---

## Security Features

✅ **Implemented:**

- Password hashing (bcrypt, 10 rounds)
- JWT tokens (24-hour expiration)
- HTTP-only cookies
- CORS configuration
- Role-based middleware
- Protected routes
- Parameterized SQL queries
- Environment variables for secrets

🔒 **Production Recommendations:**

- Change JWT_SECRET to strong random string
- Enable HTTPS (secure cookies)
- Implement rate limiting
- Add input validation
- Set up audit logging
- Enable monitoring

---

## Use Cases

### For Employees

1. Login to access daily tasks
2. Use Bottle Analyzer for quality control
3. Manage inventory with barcode scanning
4. Track personal progress

### For Supervisors

1. Login with supervisor credentials
2. Access all employee features
3. **View Analytics Dashboard** to:
   - Monitor team productivity
   - Identify employees needing training
   - Analyze error rates
   - Balance workloads across team
   - Recognize top performers
   - Make data-driven decisions

---

## Development

### Adding New Roles

1. Update database schema to include new role
2. Add role check to `utils/auth.js`
3. Create role-specific routes
4. Update frontend role checking

### Adding New Metrics

1. Add query to `models/Metrics.js`
2. Create endpoint in `server.js`
3. Update dashboard component
4. Add data visualization

### Customization

- Colors: Edit Tailwind classes
- Branding: Update logos in `src/assets/`
- Metrics: Modify queries in `models/Metrics.js`

---

## Troubleshooting

| Problem                     | Solution                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| Cannot connect to Snowflake | Check `backend/.env` credentials and network access               |
| Login fails                 | Ensure `init_database.py` was run and backend is running          |
| CORS errors                 | Verify ports (3001, 5173) and CORS origin settings in `server.js` |
| Token expired               | Logout and login again                                            |
| Dashboard no data           | Mock data used by default or run data initialization script       |

See [AUTH_SETUP.md](AUTH_SETUP.md) for detailed troubleshooting.

---

## Credits

**Project**: SmartStation
**Event**: HackMTY 2025
**Implementation**: January 2025

---

## License

© 2025 SmartStation / GateGroup

---

**System Status**: ✅ Ready for local testing

**Demo**: http://localhost:5173 (after setup)

---

Ready to transform your operations with AI-powered analytics! 🚀

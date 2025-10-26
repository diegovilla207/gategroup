# Quick Start Guide

Get your authentication system up and running in 5 minutes!

## Prerequisites

- Node.js installed
- Python 3 installed
- Snowflake credentials configured in `backend/.env`

## Installation & Setup

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install
pip install snowflake-connector-python python-dotenv bcrypt

# Frontend dependencies
cd ../gategroup
npm install
```

### 2. Initialize Database

```bash
cd ../backend
python3 scripts/init_database.py
```

Expected output:
```
✅ Database initialization completed successfully!

📋 Demo Credentials:
   Supervisor: supervisor / password123
   Employee:   employee / password123
```

### 3. Start Backend Server

```bash
# In the backend directory
npm start
```

Server starts on: **http://localhost:3001**

### 4. Start Frontend Server

```bash
# In a new terminal, navigate to gategroup directory
cd gategroup
npm run dev
```

Frontend starts on: **http://localhost:5173**

## Test the System

1. Open browser: **http://localhost:5173**
2. Login with:
   - **Supervisor**: `supervisor` / `password123`
   - **Employee**: `employee` / `password123`

### What to Expect

**Employee View:**
- Smart Bottle Analyzer
- Inventory Manager

**Supervisor View:**
- Smart Bottle Analyzer
- Inventory Manager
- **Analytics Dashboard** (with team metrics)

## File Structure

```
├── backend/
│   ├── config/snowflake.js         # Database connection
│   ├── models/User.js               # User authentication
│   ├── models/Metrics.js            # Dashboard metrics
│   ├── utils/auth.js                # JWT middleware
│   ├── scripts/init_database.py    # DB setup script
│   └── server.js                    # Main server
│
└── gategroup/src/
    ├── context/AuthContext.jsx      # Auth state management
    ├── components/ProtectedRoute.jsx # Route protection
    ├── pages/Login.jsx              # Login page
    ├── pages/HomePage.jsx           # Home (role-based)
    └── pages/SupervisorDashboard.jsx # Supervisor analytics
```

## Troubleshooting

**Cannot connect to Snowflake?**
- Check credentials in `backend/.env`
- Ensure Snowflake account is active

**Login not working?**
- Make sure you ran `init_database.py`
- Check both servers are running

**CORS errors?**
- Backend on port 3001
- Frontend on port 5173

## Next Steps

See [AUTH_SETUP.md](AUTH_SETUP.md) for complete documentation.

---

**Ready to code!** 🚀

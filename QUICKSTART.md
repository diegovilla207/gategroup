## Quick Start Guide

Get SmartStation running locally (backend + frontend) in a few minutes.

## Prerequisites

- Node.js (v16+)
- Python 3 (v3.8+)
- npm or yarn
- Snowflake credentials configured in `backend/.env` (optional for full features)

## Installation & Setup

1. Install dependencies

```powershell
cd backend; npm install
pip install snowflake-connector-python python-dotenv bcrypt

cd ..\gategroup; npm install
```

2. Initialize demo database (optional - creates demo users and sample data)

```powershell
cd backend; python3 scripts/init_database.py
```

Expected output:

```
✅ Database initialization completed successfully!

📋 Demo Credentials:
   Supervisor: supervisor / password123
   Employee:   employee / password123
```

3. Start backend server

```powershell
cd backend; npm start
```

Backend default: http://localhost:3001

4. Start frontend server

```powershell
cd gategroup; npm run dev
```

Frontend default: http://localhost:5173

## Test the System

1. Open http://localhost:5173
2. Login with demo credentials:
   - Supervisor: `supervisor` / `password123`
   - Employee: `employee` / `password123`

What to expect

- Employee: access to Smart Bottle Analyzer and Inventory
- Supervisor: same access plus Analytics Dashboard

## Troubleshooting

- Cannot connect to Snowflake: verify `backend/.env` and network access
- Login fails: ensure backend is running and init script completed
- CORS errors: check backend origin settings and ports (3001/5173)

See `AUTH_SETUP.md` for full setup and troubleshooting.

---

Ready to run SmartStation! 🚀

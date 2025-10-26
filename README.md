# SmartStation

SmartStation is an end-to-end application for in-flight inventory validation and line productivity tracking with role-based access control, supervisor analytics, and AI-assisted visual inventory validation.

This repository contains a full-stack implementation (frontend + backend + scripts) used to manage smart bottle analysis, flight inventory validation, and supervisor dashboards with productivity metrics.

Contents

- `backend/` — Node.js + Express backend, Snowflake integration, auth endpoints, inventory and metrics APIs.
- `gategroup/` — Frontend (React + Vite + Tailwind) with pages for login, bottle analysis, inventory, and supervisor dashboard.
- Documentation files (this README, `QUICKSTART.md`, `AUTH_SETUP.md`, `README_AUTH.md`, `SYSTEM_ARCHITECTURE.md`, `IMPLEMENTATION_SUMMARY.md`, `INVENTORY_SYSTEM_README.md`, `SETUP_CHECKLIST.md`).

Key features

- Secure authentication: JWT tokens, bcrypt password hashing, HTTP-only cookies, role-based access control (Employee / Supervisor).
- Supervisor analytics: productivity, error rates, efficiency metrics and actionable insights.
- Inventory validation: flight-specific inventory, category-based validation, AI-assisted image analysis (Gemini) for product detection and weight reading.
- Demo users and data: initialization script inserts demo accounts and sample metrics for quick testing.

Quick start

1.  Backend dependencies

    - Open a terminal and run:

      cd backend
      npm install

    - Install Python deps used by backend scripts:

      pip install snowflake-connector-python python-dotenv bcrypt

2.  Initialize database (demo data)

    cd backend
    python3 scripts/init_database.py

3.  Start backend server

        npm start

    Backend runs on http://localhost:3001 by default.

4.  Start frontend

        cd gategroup
        npm install
        npm run dev

    Frontend runs on http://localhost:5173 by default.

Demo credentials

- supervisor@gategroup.com / supervisor123 (supervisor)
- employee@gategroup.com / employee123 (employee)

API overview

- POST /api/auth/login — login and set auth cookie
- POST /api/auth/logout — clear cookie
- GET /api/auth/me — current user
- GET /api/metrics/dashboard — supervisor-only dashboard
- POST /api/inventory/flight — get expected flight inventory
- POST /api/inventory/validate — validate scanned inventory
- GET /api/health — health check

Where to look next

- Read `AUTH_SETUP.md` for detailed installation and Snowflake setup.
- See `QUICKSTART.md` for a compact 5-minute start guide.
- See `INVENTORY_SYSTEM_README.md` for inventory-specific instructions and Gemini format.
- Open `gategroup/src/` to view frontend pages and components.

Contributing

- Follow existing code style. Frontend uses React + Tailwind; backend uses Express.
- Add tests for new backend endpoints and update the documentation.

License

- This repository does not include a license file. Add one if you plan to publish or share.

Contact

- For questions about the project, open an issue in the repository.

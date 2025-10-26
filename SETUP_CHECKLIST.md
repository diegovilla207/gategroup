# Setup Checklist - GateGroup Authentication System

Follow this checklist step by step to get your authentication system running.

---

## Prerequisites ✓

- [ ] Node.js installed (v16+)
- [ ] Python 3 installed (v3.8+)
- [ ] npm or yarn installed
- [ ] Snowflake credentials available
- [ ] Terminal/Command prompt ready

---

## Phase 1: Backend Setup

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

- [ ] All npm packages installed successfully
- [ ] No errors in terminal

### Step 2: Install Python Dependencies
```bash
pip install snowflake-connector-python python-dotenv bcrypt
```

- [ ] Snowflake connector installed
- [ ] python-dotenv installed
- [ ] bcrypt installed

### Step 3: Verify Environment Variables
```bash
cat .env
```

Check that `.env` contains:
- [ ] SNOWFLAKE_USER
- [ ] SNOWFLAKE_PASSWORD
- [ ] SNOWFLAKE_ACCOUNT
- [ ] SNOWFLAKE_WAREHOUSE
- [ ] SNOWFLAKE_DATABASE
- [ ] SNOWFLAKE_SCHEMA
- [ ] JWT_SECRET

### Step 4: Initialize Database
```bash
python3 scripts/init_database.py
```

Expected output:
- [ ] "Connected successfully" message
- [ ] "USERS table created successfully"
- [ ] "DRAWER_COMPLETIONS table created successfully"
- [ ] "INVENTORY_SCANS table created successfully"
- [ ] "Created user: supervisor (supervisor)"
- [ ] "Created user: employee (employee)"
- [ ] "Database initialization completed successfully!"

### Step 5: Start Backend Server
```bash
npm start
```

Expected output:
- [ ] "Backend server running on http://localhost:3001"
- [ ] List of available endpoints
- [ ] "Snowflake connection successful"
- [ ] No errors

**Keep this terminal open!**

---

## Phase 2: Frontend Setup

### Step 6: Install Frontend Dependencies

Open a **new terminal** window:

```bash
cd gategroup
npm install
```

- [ ] All npm packages installed successfully
- [ ] No peer dependency warnings

### Step 7: Start Frontend Server
```bash
npm run dev
```

Expected output:
- [ ] "VITE ready in X ms"
- [ ] "Local: http://localhost:5173"
- [ ] "Network: use --host to expose"

**Keep this terminal open!**

---

## Phase 3: Testing

### Step 8: Access the Application

Open browser and navigate to: **http://localhost:5173**

- [ ] Login page loads
- [ ] No console errors
- [ ] Robot mascot visible
- [ ] Demo credentials shown

### Step 9: Test Employee Login

Login with:
- Username: `employee`
- Password: `password123`

- [ ] Login successful
- [ ] Redirected to /home
- [ ] See "Smart Bottle Analyzer" option
- [ ] See "Inventory Manager" option
- [ ] **DO NOT** see "Analytics Dashboard" option
- [ ] User info shown in top-right
- [ ] Logout button visible

### Step 10: Test Protected Routes (Employee)

Try accessing: **http://localhost:5173/dashboard**

- [ ] Redirected back to /home
- [ ] Cannot access supervisor dashboard

### Step 11: Logout

Click logout button

- [ ] Redirected to login page
- [ ] Session cleared

### Step 12: Test Supervisor Login

Login with:
- Username: `supervisor`
- Password: `password123`

- [ ] Login successful
- [ ] Redirected to /home
- [ ] See "Smart Bottle Analyzer" option
- [ ] See "Inventory Manager" option
- [ ] **DO** see "Analytics Dashboard" option (purple card)
- [ ] User role shows "supervisor"

### Step 13: Access Supervisor Dashboard

Click on "Analytics Dashboard"

- [ ] Redirected to /dashboard
- [ ] See "Overall Line Efficiency" section
- [ ] See "Employee Productivity" table with data
- [ ] See "Error Rate Analysis" table
- [ ] See "Insights & Recommendations" section
- [ ] Back to Home button works
- [ ] Logout button works

---

## Phase 4: API Testing (Optional)

### Step 14: Test Login Endpoint

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"supervisor","password":"password123"}' \
  -c cookies.txt
```

- [ ] Returns 200 status
- [ ] Returns user object
- [ ] Returns JWT token
- [ ] Cookie file created

### Step 15: Test Protected Endpoint

```bash
curl http://localhost:3001/api/auth/me -b cookies.txt
```

- [ ] Returns 200 status
- [ ] Returns user information

### Step 16: Test Metrics Endpoint

```bash
curl http://localhost:3001/api/metrics/dashboard -b cookies.txt
```

- [ ] Returns 200 status
- [ ] Returns productivity data
- [ ] Returns error rates
- [ ] Returns efficiency metrics

### Step 17: Run Automated Test Script

```bash
cd backend
./scripts/test_auth.sh
```

- [ ] All 8 tests pass with green checkmarks
- [ ] No red errors

---

## Phase 5: Verification

### Step 18: Check Backend Logs

Review backend terminal output:

- [ ] No error messages
- [ ] See login events logged
- [ ] See database queries executing
- [ ] Snowflake connection stable

### Step 19: Check Frontend Console

Open browser DevTools (F12) → Console:

- [ ] No red errors
- [ ] No CORS errors
- [ ] No 401/403 errors when logged in

### Step 20: Verify Database

Check Snowflake (optional):

```sql
SELECT * FROM USERS;
```

- [ ] 5 users in database
- [ ] Passwords are hashed (not plain text)
- [ ] Roles assigned correctly

---

## Phase 6: Final Checks

### Step 21: Security Verification

- [ ] Passwords are hashed in database
- [ ] JWT token stored in HTTP-only cookie
- [ ] Cannot access token via JavaScript console
- [ ] Protected routes redirect when not logged in
- [ ] Role-based access works correctly

### Step 22: Documentation Review

- [ ] Read [QUICKSTART.md](QUICKSTART.md)
- [ ] Reviewed [AUTH_SETUP.md](AUTH_SETUP.md)
- [ ] Checked [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- [ ] Understand API endpoints

### Step 23: Production Preparation (Before Deploying)

- [ ] Change JWT_SECRET to strong random string
- [ ] Update CORS origin for production domain
- [ ] Enable HTTPS
- [ ] Set `secure: true` for cookies
- [ ] Remove demo credentials display from login page
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Configure backups

---

## Troubleshooting

If any step fails, check:

### Backend won't start
- [ ] Node.js version is 16+
- [ ] All dependencies installed
- [ ] Port 3001 is available
- [ ] .env file exists and is valid

### Database initialization fails
- [ ] Python 3 installed
- [ ] pip packages installed
- [ ] Snowflake credentials correct
- [ ] Internet connection active
- [ ] Snowflake account not suspended

### Frontend won't start
- [ ] All dependencies installed
- [ ] Port 5173 is available
- [ ] No syntax errors in code

### Login fails
- [ ] Backend server is running
- [ ] Database initialized successfully
- [ ] Using correct credentials
- [ ] Check backend logs for errors

### CORS errors
- [ ] Backend on port 3001
- [ ] Frontend on port 5173
- [ ] CORS origin matches frontend URL
- [ ] credentials: 'include' in fetch requests

### Cannot access dashboard
- [ ] Logged in as supervisor (not employee)
- [ ] Token is valid (not expired)
- [ ] Backend server running

---

## Success Indicators ✅

You've successfully set up the system if:

✅ Both servers running without errors
✅ Can login as employee and supervisor
✅ Employee cannot access dashboard
✅ Supervisor can access dashboard with metrics
✅ Protected routes work correctly
✅ Logout functionality works
✅ No console errors
✅ API endpoints return expected data

---

## Next Steps

Once everything is checked:

1. **Customize the system**
   - Update branding/colors
   - Add more metrics
   - Create additional user roles

2. **Add features**
   - Password reset
   - User profile editing
   - Email notifications

3. **Prepare for production**
   - Security hardening
   - Performance optimization
   - Monitoring setup

---

## Need Help?

- 📖 Documentation: [AUTH_SETUP.md](AUTH_SETUP.md)
- 🐛 Troubleshooting: See AUTH_SETUP.md → Troubleshooting section
- 🔍 Logs: Check terminal outputs for error messages

---

## Completion

Date: ________________

Completed by: ________________

System Status: ✅ Ready for Development / Production

---

**Congratulations! Your authentication system is ready!** 🎉

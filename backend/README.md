# GateGroup Backend Server

Express.js backend with Snowflake authentication and role-based access control.

## Features

- JWT authentication with HTTP-only cookies
- Snowflake database integration
- Role-based access control (Employee/Supervisor)
- Secure password hashing with bcrypt
- RESTful API endpoints
- Supervisor analytics and metrics

## Installation

```bash
npm install
pip install snowflake-connector-python python-dotenv bcrypt
```

## Configuration

Environment variables in `.env`:
```env
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=LOGIN_DB
SNOWFLAKE_SCHEMA=MAIN
JWT_SECRET=your_secret_key
```

## Database Setup

```bash
python3 scripts/init_database.py
```

## Running

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on: **http://localhost:3001**

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user (protected)

### Metrics (Supervisor Only)
- `GET /api/metrics/dashboard` - Complete dashboard data
- `GET /api/metrics/productivity` - Productivity per employee
- `GET /api/metrics/error-rates` - Error rates per employee
- `GET /api/metrics/efficiency` - Overall efficiency

### Inventory
- `POST /api/inventory/flight` - Get inventory by flight number
- `POST /api/inventory/validate` - Validate scanned inventory

### System
- `GET /api/health` - Health check

## Project Structure

```
backend/
├── config/
│   └── snowflake.js       # Snowflake connection utilities
├── models/
│   ├── User.js            # User model
│   └── Metrics.js         # Metrics model
├── utils/
│   └── auth.js            # JWT middleware & utilities
├── scripts/
│   ├── init_database.py   # Database initialization
│   ├── get_inventory.py   # Inventory queries
│   └── validate_inventory.py
├── .env                   # Environment variables
├── server.js              # Main server file
└── package.json
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiration
- HTTP-only cookies for token storage
- CORS configuration
- Protected routes with role checking
- Parameterized SQL queries to prevent injection

## Demo Users

| Username | Password | Role |
|----------|----------|------|
| supervisor | password123 | supervisor |
| employee | password123 | employee |

## Development

The server uses ES modules (`"type": "module"` in package.json).

### Adding New Endpoints

1. Create model in `models/` if needed
2. Add route handler in `server.js`
3. Use authentication middleware for protected routes
4. Use role middleware for role-specific routes

Example:
```javascript
app.get('/api/protected', authenticateToken, (req, res) => {
    // req.user contains authenticated user info
    res.json({ message: 'Protected data' });
});

app.get('/api/supervisor-only', authenticateToken, requireSupervisor, (req, res) => {
    // Only supervisors can access
    res.json({ message: 'Supervisor data' });
});
```

## Testing

Test Snowflake connection:
```bash
node -e "import('./config/snowflake.js').then(m => m.testConnection())"
```

Test login with curl:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"supervisor","password":"password123"}' \
  -c cookies.txt
```

## License

HackMTY 2025 - GateGroup SmartStation

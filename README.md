# GateGroup SmartStation

> AI-Powered Airline Catering Inventory Management System

A full-stack web application designed for airline catering inventory management with AI-powered quality control and comprehensive supervisor analytics. Built for HackMTY 2025.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [User Guide](#user-guide)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Security](#security)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

**GateGroup SmartStation** is a comprehensive inventory management solution that combines:

- **Smart Bottle Analyzer**: AI-powered quality control for beverage bottles using Google Gemini Vision
- **Inventory Manager**: Flight-based inventory tracking with real-time validation
- **Supervisor Dashboard**: Advanced analytics with performance metrics, error tracking, and AI assistant
- **Authentication System**: JWT-based security with role-based access control

The system helps airline catering operations improve efficiency, reduce waste, and maintain compliance with airline Service Level Agreements (SLAs).

---

## Features

### For All Users
- Secure JWT-based authentication
- Role-based access control (Employee/Supervisor)
- Modern, responsive UI with animations
- Multi-language support (English/Spanish)

### Smart Bottle Analyzer
- AI-powered quality assessment using Google Gemini Vision API
- Support for multiple airlines:
  - British Airways (BA)
  - Emirates (EK)
  - Turkish Airlines (TK)
  - Etihad Airways (EY)
  - Cathay Pacific (CX)
  - Singapore Airlines (SQ)
- Automated SLA compliance checking
- Action recommendations (KEEP, REPLACE, REFILL, DISCARD)
- Photo upload with real-time analysis

### Inventory Manager
- Flight-based inventory lookup
- Multi-cart scanning workflow
- AI-powered item recognition
- Real-time validation against expected inventory
- Session tracking for analytics
- Error logging and reporting

### Supervisor Analytics Dashboard
- **Real-time Metrics**:
  - Employee productivity (drawers/hour)
  - Error rates by employee
  - Overall line efficiency
  - Item processing speed
  - Accuracy scores
- **Performance Trends** (last 30 days):
  - Session counts and active employees
  - Error distribution over time
  - Average session duration
- **Error Analysis**:
  - Error type distribution
  - Critical error percentage
  - Per-employee error patterns
- **Employee Performance**:
  - Items per hour ranking
  - Error rate percentage
  - Accuracy scores
  - Performance scoring algorithm
- **Sustainability Metrics**:
  - Errors prevented
  - Waste reduction (kg)
  - Time saved
  - Cost savings
- **Active Alerts**:
  - Performance threshold breaches
  - Error rate anomalies
  - Training needs identification
- **AI Assistant**:
  - Context-aware conversations
  - Analytics insights generation
  - Performance optimization suggestions
  - Training recommendations
- **Auto-refresh**: Dashboard updates every 30 seconds

---

## Technology Stack

### Frontend
- **React** 19.1.1 - UI framework
- **Vite** 7.1.7 - Build tool with HMR
- **Tailwind CSS** 3.4.18 - Utility-first styling
- **React Router DOM** 7.9.4 - Client-side routing
- **Recharts** 3.3.0 - Data visualization
- **Heroicons** 2.2.0 - Icon library
- **date-fns** 4.1.0 - Date utilities

### Backend
- **Node.js** - JavaScript runtime (ES modules)
- **Express.js** 4.18.2 - Web framework
- **JWT** (jsonwebtoken 9.0.2) - Authentication
- **bcryptjs** 3.0.2 - Password hashing
- **Snowflake SDK** 2.3.1 - Database driver
- **CORS** 2.8.5 - Cross-origin resource sharing
- **nodemon** 3.0.1 - Development auto-reload

### Database
- **Snowflake** - Cloud data platform
  - Account: cucbppa-am55842
  - Database: GATE_GROUP_INVENTORY
  - Schema: MAIN
  - Warehouse: COMPUTE_WH

### AI Services
- **Google Gemini AI** - Vision and text analysis
  - Gemini 1.5 Pro - Bottle analysis
  - Gemini 2.5 Flash - AI assistant

---

## Project Structure

```
gategroup-1/
├── gategroup/                      # Frontend application
│   ├── src/
│   │   ├── assets/                # Images and static files
│   │   ├── components/            # Reusable React components
│   │   │   ├── ProtectedRoute.jsx # Route authentication wrapper
│   │   │   ├── AIAssistant.jsx    # AI chat component
│   │   │   └── EagleMascot.jsx    # Mascot component
│   │   ├── context/               # React Context providers
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── hooks/                 # Custom React hooks
│   │   │   └── useSound.js        # Sound effects hook
│   │   ├── pages/                 # Route components
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── HomePage.jsx       # Dashboard home
│   │   │   ├── SmartBottleAnalyzer.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── SupervisorDashboard.jsx
│   │   │   └── EnhancedSupervisorDashboard.jsx
│   │   ├── App.jsx                # Main app with routing
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles + animations
│   ├── public/                    # Static assets
│   ├── index.html                 # HTML template
│   ├── vite.config.js             # Vite configuration
│   ├── tailwind.config.js         # Tailwind configuration
│   ├── postcss.config.js          # PostCSS configuration
│   ├── eslint.config.js           # ESLint configuration
│   └── package.json               # Frontend dependencies
│
├── backend/                        # Backend application
│   ├── config/
│   │   └── snowflake.js           # Database connection
│   ├── models/                    # Data models
│   │   ├── User.js                # User authentication
│   │   ├── Metrics.js             # Performance metrics
│   │   └── Analytics.js           # Advanced analytics
│   ├── utils/
│   │   └── auth.js                # JWT middleware
│   ├── scripts/                   # Python utilities
│   │   ├── init_database.py       # Database initialization
│   │   ├── test_snowflake.py      # Connection testing
│   │   ├── crear_orden.py         # Inventory operations
│   │   └── validate_inventory.py  # Inventory validation
│   ├── server.js                  # Express server
│   ├── .env                       # Environment variables
│   └── package.json               # Backend dependencies
│
├── SYSTEM_ARCHITECTURE.md         # Architecture documentation
└── README.md                      # This file
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Python** 3.8+ (for database scripts) - [Download](https://www.python.org/)
- **Git** - [Download](https://git-scm.com/)

You will also need:

- **Snowflake account** with database access
- **Google Gemini API key** - [Get API Key](https://makersuite.google.com/app/apikey)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gategroup-1
```

### 2. Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies (optional, for scripts)
pip install snowflake-connector-python python-dotenv
```

### 3. Frontend Setup

```bash
cd gategroup

# Install dependencies
npm install
```

---

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Snowflake Configuration
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_ACCOUNT=your_account_id
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=GATE_GROUP_INVENTORY
SNOWFLAKE_SCHEMA=MAIN

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Server Configuration
NODE_ENV=development
PORT=3001
```

**Important**: Replace placeholder values with your actual credentials.

### Frontend Configuration

The frontend is configured to connect to `http://localhost:3001` by default.

To change the API endpoint, edit [gategroup/src/context/AuthContext.jsx](gategroup/src/context/AuthContext.jsx):

```javascript
const API_URL = 'http://localhost:3001'; // Change this for production
```

### Google Gemini API Keys

For development, API keys are embedded in components. For production:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update the keys in:
   - [gategroup/src/pages/SmartBottleAnalyzer.jsx](gategroup/src/pages/SmartBottleAnalyzer.jsx)
   - [gategroup/src/pages/Inventory.jsx](gategroup/src/pages/Inventory.jsx)
   - [gategroup/src/components/AIAssistant.jsx](gategroup/src/components/AIAssistant.jsx)

Search for `AIzaSy` to find the locations.

### Database Initialization

Initialize the Snowflake database schema:

```bash
cd backend/scripts
python3 init_database.py
```

This will create:
- `USERS` table
- `DRAWER_COMPLETIONS` table
- `INVENTORY_SCANS` table
- Default user accounts:
  - **Employee**: email: `employee@gategroup.com`, password: `employee123`
  - **Supervisor**: email: `supervisor@gategroup.com`, password: `supervisor123`

Test the connection:

```bash
python3 test_snowflake.py
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001`

**Terminal 2 - Frontend:**

```bash
cd gategroup
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd gategroup
npm run build    # Build for production
npm run preview  # Preview production build
```

For production deployment, serve the `gategroup/dist/` folder with a static file server.

---

## User Guide

### Logging In

1. Navigate to `http://localhost:5173`
2. Use one of the demo accounts:
   - **Employee Account**:
     - Email: `employee@gategroup.com`
     - Password: `employee123`
   - **Supervisor Account**:
     - Email: `supervisor@gategroup.com`
     - Password: `supervisor123`

### Using Smart Bottle Analyzer (Employee)

1. From the home page, click **Smart Bottle Analyzer**
2. Select an airline from the dropdown
3. Upload a photo of the bottle
4. Wait for AI analysis (3-5 seconds)
5. Review the action recommendation:
   - **KEEP**: Bottle is in good condition for reuse
   - **REPLACE**: Bottle needs to be replaced
   - **REFILL**: Bottle just needs refilling
   - **DISCARD**: Bottle should be recycled
6. Follow the displayed instructions

### Using Inventory Manager (Employee)

1. From the home page, click **Inventory Manager**
2. Enter a flight number (e.g., `AA100`, `BA456`)
3. Select a cart/bin number
4. Upload photos of items in the cart
5. Wait for AI processing
6. Review validation results:
   - Green checkmarks: Items match expected inventory
   - Red X marks: Discrepancies detected
7. Continue to next cart or complete session

### Accessing Supervisor Dashboard (Supervisor Only)

1. Log in with supervisor credentials
2. From the home page, click **Analytics Dashboard**
3. View real-time metrics and performance data
4. Navigate between tabs:
   - **Overview**: Key metrics at a glance
   - **Performance**: Detailed employee performance
   - **Errors**: Error analysis and distribution
   - **Sustainability**: Environmental impact metrics
5. Use the AI Assistant (bottom-right) to ask questions about the data
6. Acknowledge alerts by clicking on them

---

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication Endpoints

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "employee@gategroup.com",
  "password": "employee123"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "username": "employee1",
    "email": "employee@gategroup.com",
    "role": "employee",
    "fullName": "Employee User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout

```http
POST /auth/logout
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

### Metrics Endpoints (Supervisor Only)

#### Dashboard Data

```http
GET /metrics/dashboard
Authorization: Bearer <token>
```

#### Productivity Metrics

```http
GET /metrics/productivity
Authorization: Bearer <token>
```

#### Error Rates

```http
GET /metrics/error-rates
Authorization: Bearer <token>
```

#### Efficiency Metrics

```http
GET /metrics/efficiency
Authorization: Bearer <token>
```

### Analytics Endpoints

#### Enhanced Dashboard

```http
GET /analytics/enhanced-dashboard
Authorization: Bearer <token>
```

#### Training Needs

```http
GET /analytics/training-needs
Authorization: Bearer <token>
```

#### Record Session

```http
POST /analytics/session
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 1,
  "startTime": "2025-10-26T10:00:00Z",
  "endTime": "2025-10-26T10:30:00Z",
  "itemsCount": 45
}
```

#### Log Error

```http
POST /analytics/error
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 1,
  "errorType": "missing_item",
  "severity": "medium"
}
```

#### Acknowledge Alert

```http
POST /analytics/alert/acknowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertId": "alert-123"
}
```

### Inventory Endpoints

#### Get Flight Inventory

```http
POST /inventory/flight
Authorization: Bearer <token>
Content-Type: application/json

{
  "flightNumber": "BA456"
}
```

#### Validate Inventory

```http
POST /inventory/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "flightNumber": "BA456",
  "cartNumber": 1,
  "scannedItems": [
    { "name": "Water Bottle", "quantity": 50 },
    { "name": "Coffee", "quantity": 30 }
  ]
}
```

---

## Database Schema

### USERS Table

| Column | Type | Constraints |
|--------|------|-------------|
| USER_ID | INTEGER | PRIMARY KEY, AUTO INCREMENT |
| USERNAME | VARCHAR(50) | UNIQUE, NOT NULL |
| PASSWORD_HASH | VARCHAR(255) | NOT NULL |
| ROLE | VARCHAR(20) | NOT NULL |
| FULL_NAME | VARCHAR(100) | NOT NULL |
| EMAIL | VARCHAR(100) | UNIQUE, NOT NULL |
| CREATED_AT | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| UPDATED_AT | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### DRAWER_COMPLETIONS Table

| Column | Type | Constraints |
|--------|------|-------------|
| DRAWER_ID | INTEGER | PRIMARY KEY, AUTO INCREMENT |
| USER_ID | INTEGER | FOREIGN KEY → USERS(USER_ID) |
| START_TIME | TIMESTAMP | NOT NULL |
| END_TIME | TIMESTAMP | NOT NULL |
| COMPLETION_DATE | DATE | NOT NULL |
| ITEMS_COUNT | INTEGER | NOT NULL |

### INVENTORY_SCANS Table

| Column | Type | Constraints |
|--------|------|-------------|
| SCAN_ID | INTEGER | PRIMARY KEY, AUTO INCREMENT |
| USER_ID | INTEGER | FOREIGN KEY → USERS(USER_ID) |
| ITEM_ID | VARCHAR(50) | NOT NULL |
| STATUS | VARCHAR(20) | NOT NULL |
| SCAN_TIME | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

## Architecture

### System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │ Vite Server  │ ◄─────► │   React     │
│             │  HTTP   │  (Dev Mode)  │  HMR    │     App     │
└─────────────┘         └──────────────┘         └─────────────┘
      │
      │ HTTP/REST API (JSON)
      ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Express   │ ◄─────► │   Snowflake  │ ◄─────► │  Cloud DB   │
│   Server    │   SQL   │     SDK      │   TLS   │             │
└─────────────┘         └──────────────┘         └─────────────┘
      │
      │ HTTPS API
      ▼
┌─────────────┐
│   Google    │
│  Gemini AI  │
└─────────────┘
```

### Authentication Flow

```
1. User submits credentials
2. Backend validates against Snowflake
3. Password verified with bcrypt
4. JWT token generated (24h expiration)
5. Token sent as HTTP-only cookie
6. Frontend stores user data in AuthContext
7. Protected routes check authentication
8. API requests include JWT in headers/cookies
```

### Component Hierarchy

```
App.jsx
├── AuthContext.Provider
├── Router
    ├── Login (public)
    ├── ProtectedRoute
        ├── HomePage
        ├── SmartBottleAnalyzer
        ├── Inventory
        └── EnhancedSupervisorDashboard
            └── AIAssistant
```

---

## Security

### Implemented Security Measures

1. **Authentication**: JWT tokens with 24-hour expiration
2. **Password Security**: bcrypt hashing with 10 salt rounds
3. **Authorization**: Role-based access control (RBAC)
4. **Transport Security**:
   - HTTP-only cookies
   - CORS configuration
   - Prepared statements for SQL queries
5. **Input Validation**: Server-side validation of all inputs
6. **Environment Variables**: Sensitive data in .env files
7. **Error Handling**: Graceful error messages without exposing internals

### Production Recommendations

- Enable HTTPS/TLS for all connections
- Use environment-specific JWT secrets
- Implement rate limiting on API endpoints
- Add request logging and monitoring
- Set up database connection pooling
- Enable Snowflake IP whitelisting
- Rotate API keys regularly
- Implement session management
- Add CSRF protection
- Use secure cookie flags (Secure, SameSite)

---

## Development

### Code Style

The project uses ESLint for code quality. Run linter:

```bash
cd gategroup
npm run lint
```

### Project Scripts

**Frontend (gategroup/):**

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

**Backend (backend/):**

```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

### Adding New Features

1. **New Frontend Page**:
   - Create component in `gategroup/src/pages/`
   - Add route in `gategroup/src/App.jsx`
   - Update navigation in `HomePage.jsx`

2. **New API Endpoint**:
   - Add route in `backend/server.js`
   - Create model methods if needed
   - Add authentication middleware if required
   - Update API documentation

3. **New Database Table**:
   - Create migration script in `backend/scripts/`
   - Update models in `backend/models/`
   - Run initialization script

### Environment Variables Reference

**Backend (.env):**

| Variable | Description | Example |
|----------|-------------|---------|
| SNOWFLAKE_USER | Database username | `admin_user` |
| SNOWFLAKE_PASSWORD | Database password | `secure_password` |
| SNOWFLAKE_ACCOUNT | Snowflake account ID | `cucbppa-am55842` |
| SNOWFLAKE_WAREHOUSE | Data warehouse name | `COMPUTE_WH` |
| SNOWFLAKE_DATABASE | Database name | `GATE_GROUP_INVENTORY` |
| SNOWFLAKE_SCHEMA | Schema name | `MAIN` |
| JWT_SECRET | Secret for JWT signing | `random_secret_key` |
| NODE_ENV | Environment mode | `development` or `production` |
| PORT | Server port | `3001` |

---

## Troubleshooting

### Common Issues

#### Backend won't start

**Problem**: `Error: Cannot find module`

**Solution**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Database connection fails

**Problem**: `Error: Invalid Snowflake credentials`

**Solutions**:
1. Verify credentials in `backend/.env`
2. Test connection: `python3 backend/scripts/test_snowflake.py`
3. Check Snowflake account status
4. Verify network connectivity

#### Frontend won't connect to backend

**Problem**: `Network Error` or `CORS error`

**Solutions**:
1. Ensure backend is running on port 3001
2. Check CORS configuration in `backend/server.js`
3. Verify API_URL in `AuthContext.jsx`
4. Check browser console for details

#### JWT token errors

**Problem**: `Invalid token` or `Token expired`

**Solutions**:
1. Clear browser cookies
2. Log out and log back in
3. Verify JWT_SECRET is consistent
4. Check token expiration (24h default)

#### Gemini API errors

**Problem**: `API key invalid` or `Quota exceeded`

**Solutions**:
1. Verify API key is correct
2. Check API quota in Google Cloud Console
3. Ensure billing is enabled
4. Try using a different API key

### Debug Mode

Enable debug logging:

**Backend:**
```bash
NODE_ENV=development npm run dev
```

**Frontend:**
Check browser console (F12) for detailed logs

### Getting Help

- Check [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) for detailed architecture
- Review error logs in `backend/snowflake.log`
- Check browser console for frontend errors
- Verify all environment variables are set

---

## Contributing

### Development Workflow

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test thoroughly:
   - Test all user flows
   - Check authentication
   - Verify database operations
   - Test error handling

4. Commit your changes
   ```bash
   git add .
   git commit -m "Add: description of changes"
   ```

5. Push to remote
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a pull request

### Coding Standards

- Use ES6+ JavaScript features
- Follow React best practices
- Use functional components with hooks
- Write clear, descriptive variable names
- Add comments for complex logic
- Keep functions small and focused
- Use Tailwind utilities for styling
- Handle errors gracefully

---

## License

This project was created for HackMTY 2025.

---

## Contact & Support

For questions or support, please contact the development team.

---

## Acknowledgments

- **HackMTY 2025** - For the opportunity
- **Google Gemini AI** - For AI capabilities
- **Snowflake** - For database platform
- **GateGroup** - For the problem domain

---

**Last Updated**: October 26, 2025

**Version**: 1.0.0

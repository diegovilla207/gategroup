# 🚀 Enhanced Supervisor Dashboard Documentation
## GateGroup SmartStation - HackMTY 2025

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [AI Assistant Integration](#ai-assistant-integration)
8. [Performance Tracking](#performance-tracking)
9. [Sustainability Metrics](#sustainability-metrics)
10. [Usage Guide](#usage-guide)
11. [Development](#development)

---

## 🎯 Overview

The Enhanced Supervisor Dashboard is a comprehensive analytics and monitoring system designed for airline catering inventory management. It provides real-time insights, performance tracking, AI-powered recommendations, and sustainability metrics.

### Key Objectives
- **Monitor** employee performance in real-time
- **Identify** training needs automatically
- **Optimize** workflows through data-driven insights
- **Reduce** errors and waste
- **Track** environmental impact and sustainability

---

## ✨ Features

### 1. Visual Analytics
- ✅ **Interactive Charts** - Line charts, bar charts, and pie charts using Recharts
- ✅ **Performance Trends** - 30-day historical data visualization
- ✅ **Error Distribution** - Visual breakdown of error types
- ✅ **Real-time Updates** - Auto-refresh every 30 seconds

### 2. Performance Metrics
- ✅ **Per-Employee Tracking**
  - Time per cart/drawer
  - Error rates by type
  - Items processed per hour
  - Accuracy scores
  - Performance scores (weighted calculation)

- ✅ **Team Analytics**
  - Overall efficiency metrics
  - Active employee count
  - Total sessions completed
  - Average processing times

### 3. AI Assistant
- ✅ **Gemini-Powered Chat** - Context-aware recommendations
- ✅ **Dashboard Data Access** - Real-time metrics integration
- ✅ **Training Insights** - Automatic need identification
- ✅ **Quick Actions** - Pre-defined queries for common tasks

### 4. Error Analysis
- ✅ **Error Type Distribution** - Visual pie charts
- ✅ **Critical Error Tracking** - Severity-based filtering
- ✅ **Employee Error Rates** - Individual performance tracking
- ✅ **Historical Trends** - Error rate over time

### 5. Sustainability Tracking
- ✅ **Waste Reduction** - kg of food waste prevented
- ✅ **Carbon Footprint** - CO₂ emissions reduced
- ✅ **Cost Savings** - Financial impact tracking
- ✅ **Process Efficiency** - Overall system efficiency %

### 6. Real-time Alerts
- ✅ **High Error Rate Alerts** - Automatic threshold monitoring
- ✅ **Performance Issues** - Slow processing identification
- ✅ **Training Needs** - Skill gap detection
- ✅ **System Issues** - Technical problem reporting

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│  EnhancedSupervisorDashboard.jsx                       │
│  ├─ Overview Tab                                       │
│  ├─ Performance Tab                                    │
│  ├─ Error Analysis Tab                                │
│  └─ Sustainability Tab                                │
│                                                         │
│  AIAssistant.jsx                                       │
│  └─ Gemini Integration                                │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node.js/Express)              │
├─────────────────────────────────────────────────────────┤
│  Analytics Model (Analytics.js)                        │
│  ├─ getEnhancedDashboard()                            │
│  ├─ getPerformanceTrends()                            │
│  ├─ getErrorDistribution()                            │
│  ├─ getTrainingNeeds()                                │
│  ├─ recordInventorySession()                          │
│  └─ saveChatInteraction()                             │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│                Database (Snowflake)                     │
├─────────────────────────────────────────────────────────┤
│  Tables:                                               │
│  ├─ INVENTORY_SESSIONS                                │
│  ├─ EMPLOYEE_PERFORMANCE_METRICS                      │
│  ├─ ERROR_LOG                                         │
│  ├─ TRAINING_NEEDS                                    │
│  ├─ AI_CHAT_HISTORY                                   │
│  ├─ SUSTAINABILITY_METRICS                            │
│  ├─ REAL_TIME_ALERTS                                  │
│  └─ PERFORMANCE_BENCHMARKS                            │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+
- React Router DOM
- Recharts (charting library)
- Tailwind CSS
- date-fns (date formatting)

**Backend:**
- Node.js
- Express.js
- Snowflake SDK
- JWT Authentication

**AI Integration:**
- Google Gemini 2.0 Flash API

---

## 📊 Database Schema

### INVENTORY_SESSIONS
Tracks each inventory validation session.

```sql
CREATE TABLE INVENTORY_SESSIONS (
    SESSION_ID VARCHAR(50) PRIMARY KEY,
    FLIGHT_NUMBER VARCHAR(20) NOT NULL,
    CART_ID INTEGER NOT NULL,
    EMPLOYEE_ID VARCHAR(50) NOT NULL,
    START_TIME TIMESTAMP_NTZ NOT NULL,
    END_TIME TIMESTAMP_NTZ,
    DURATION_SECONDS INTEGER,
    PHOTOS_TAKEN INTEGER DEFAULT 0,
    ITEMS_SCANNED INTEGER DEFAULT 0,
    ERRORS_DETECTED INTEGER DEFAULT 0,
    STATUS VARCHAR(20) DEFAULT 'IN_PROGRESS',
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### EMPLOYEE_PERFORMANCE_METRICS
Daily aggregated metrics per employee.

```sql
CREATE TABLE EMPLOYEE_PERFORMANCE_METRICS (
    METRIC_ID INTEGER AUTOINCREMENT PRIMARY KEY,
    EMPLOYEE_ID VARCHAR(50) NOT NULL,
    METRIC_DATE DATE NOT NULL,
    TOTAL_SESSIONS INTEGER DEFAULT 0,
    TOTAL_CARTS_COMPLETED INTEGER DEFAULT 0,
    TOTAL_ITEMS_PROCESSED INTEGER DEFAULT 0,
    TOTAL_ERRORS INTEGER DEFAULT 0,
    TOTAL_DURATION_SECONDS INTEGER DEFAULT 0,
    AVG_TIME_PER_CART_SECONDS FLOAT,
    ERROR_RATE_PERCENT FLOAT,
    ITEMS_PER_HOUR FLOAT,
    ACCURACY_SCORE FLOAT,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### ERROR_LOG
Detailed error tracking for analysis.

```sql
CREATE TABLE ERROR_LOG (
    ERROR_ID INTEGER AUTOINCREMENT PRIMARY KEY,
    SESSION_ID VARCHAR(50) NOT NULL,
    EMPLOYEE_ID VARCHAR(50) NOT NULL,
    ERROR_TYPE VARCHAR(50) NOT NULL,
    ERROR_DESCRIPTION TEXT,
    PRODUCT_SKU VARCHAR(100),
    EXPECTED_VALUE VARCHAR(200),
    ACTUAL_VALUE VARCHAR(200),
    SEVERITY VARCHAR(20) DEFAULT 'MEDIUM',
    RESOLVED BOOLEAN DEFAULT FALSE,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### TRAINING_NEEDS
Identified training requirements.

```sql
CREATE TABLE TRAINING_NEEDS (
    TRAINING_ID INTEGER AUTOINCREMENT PRIMARY KEY,
    EMPLOYEE_ID VARCHAR(50) NOT NULL,
    SKILL_AREA VARCHAR(100) NOT NULL,
    PRIORITY VARCHAR(20) DEFAULT 'MEDIUM',
    CURRENT_SCORE FLOAT,
    TARGET_SCORE FLOAT DEFAULT 90.0,
    STATUS VARCHAR(20) DEFAULT 'PENDING',
    NOTES TEXT,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### AI_CHAT_HISTORY
Store AI assistant conversations.

```sql
CREATE TABLE AI_CHAT_HISTORY (
    CHAT_ID INTEGER AUTOINCREMENT PRIMARY KEY,
    SESSION_ID VARCHAR(50),
    USER_ID VARCHAR(50) NOT NULL,
    USER_MESSAGE TEXT NOT NULL,
    AI_RESPONSE TEXT NOT NULL,
    CONTEXT_DATA JSON,
    SENTIMENT VARCHAR(20),
    ACTION_TAKEN VARCHAR(100),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### SUSTAINABILITY_METRICS
Environmental impact tracking.

```sql
CREATE TABLE SUSTAINABILITY_METRICS (
    METRIC_ID INTEGER AUTOINCREMENT PRIMARY KEY,
    METRIC_DATE DATE NOT NULL,
    ERRORS_PREVENTED INTEGER DEFAULT 0,
    WASTE_REDUCTION_KG FLOAT DEFAULT 0.0,
    TIME_SAVED_MINUTES INTEGER DEFAULT 0,
    PROCESS_EFFICIENCY_PERCENT FLOAT,
    COST_SAVINGS_USD FLOAT DEFAULT 0.0,
    CARBON_FOOTPRINT_REDUCTION_KG FLOAT DEFAULT 0.0,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### REAL_TIME_ALERTS
Dashboard alerts system.

```sql
CREATE TABLE REAL_TIME_ALERTS (
    ALERT_ID INTEGER AUTOINCREMENT PRIMARY KEY,
    ALERT_TYPE VARCHAR(50) NOT NULL,
    SEVERITY VARCHAR(20) DEFAULT 'MEDIUM',
    EMPLOYEE_ID VARCHAR(50),
    TITLE VARCHAR(200) NOT NULL,
    MESSAGE TEXT NOT NULL,
    STATUS VARCHAR(20) DEFAULT 'ACTIVE',
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

---

## 🔌 API Endpoints

### Enhanced Analytics Endpoints

#### GET /api/analytics/enhanced-dashboard
**Description:** Get comprehensive dashboard data with charts and trends
**Authentication:** Required (Supervisor only)
**Response:**
```json
{
  "performanceTrends": [...],
  "errorDistribution": [...],
  "employeeMetrics": [...],
  "alerts": [...],
  "sustainabilityMetrics": {...},
  "lastUpdated": "2025-10-26T09:00:00Z"
}
```

#### GET /api/analytics/training-needs
**Description:** Get identified training requirements
**Authentication:** Required (Supervisor only)
**Response:**
```json
[
  {
    "id": 1,
    "employeeId": "emp123",
    "skillArea": "PRODUCT_IDENTIFICATION",
    "priority": "HIGH",
    "currentScore": 85.5,
    "targetScore": 90.0,
    "status": "PENDING"
  }
]
```

#### POST /api/analytics/session
**Description:** Record an inventory session
**Authentication:** Required
**Body:**
```json
{
  "sessionId": "session-123",
  "flightNumber": "IB789",
  "cartId": 30,
  "employeeId": "emp123",
  "startTime": "2025-10-26T08:00:00Z",
  "endTime": "2025-10-26T08:45:00Z",
  "photosTaken": 5,
  "itemsScanned": 50,
  "errorsDetected": 2,
  "status": "COMPLETED"
}
```

#### POST /api/analytics/error
**Description:** Log an error for analysis
**Authentication:** Required
**Body:**
```json
{
  "sessionId": "session-123",
  "employeeId": "emp123",
  "errorType": "MISSING_ITEM",
  "description": "Item not found in cart",
  "productSku": "canelitas_35g",
  "severity": "MEDIUM"
}
```

#### POST /api/analytics/chat
**Description:** Save AI chat interaction
**Authentication:** Required
**Body:**
```json
{
  "sessionId": "chat-123",
  "userId": "supervisor@gategroup.com",
  "userMessage": "Analyze performance trends",
  "aiResponse": "Based on current data...",
  "contextData": {...}
}
```

#### POST /api/analytics/alert/acknowledge
**Description:** Acknowledge an alert
**Authentication:** Required (Supervisor only)
**Body:**
```json
{
  "alertId": 1
}
```

---

## 🖥️ Frontend Components

### EnhancedSupervisorDashboard
Main dashboard component with 4 tabs:

**1. Overview Tab**
- Key metrics cards (employees, drawers, error rate)
- Performance trends line chart (30 days)
- Employee performance table

**2. Performance Tab**
- Items per hour bar chart
- Accuracy score bar chart
- Training needs list

**3. Error Analysis Tab**
- Error distribution pie chart
- Error types breakdown
- Error rates by employee table

**4. Sustainability Tab**
- Impact metrics cards
- Environmental impact summary
- Operational efficiency metrics

### AIAssistant Component
Collapsible chat interface with:
- Gemini AI integration
- Context-aware responses
- Quick action buttons
- Chat history persistence
- Real-time dashboard data access

---

## 🤖 AI Assistant Integration

### Features
1. **Context-Aware:** Analyzes current dashboard data
2. **Quick Actions:** Pre-defined queries for common tasks
3. **Training Recommendations:** Based on performance metrics
4. **Error Pattern Analysis:** Identifies recurring issues
5. **Workflow Optimization:** Suggests improvements

### Example Prompts
- "Analyze the current performance trends and identify any concerns."
- "Who needs training and in what areas based on current metrics?"
- "What specific actions can we take to reduce error rates?"
- "Suggest ways to improve overall workflow efficiency."

### Implementation
```javascript
// Gemini API Call
const response = await fetch(geminiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [contextPrompt, ...conversationHistory, userMessage],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  })
});
```

---

## 📈 Performance Tracking

### Metrics Calculated

#### 1. Performance Score
```javascript
performanceScore = (speedScore × 0.3) + (accuracyScore × 0.5) + (errorPenalty × 0.2)

where:
  speedScore = min(itemsPerHour / 70 × 100, 100)
  accuracyScore = 100 - errorRate
  errorPenalty = max(0, 100 - (errorRate × 50))
```

#### 2. Error Rate
```
errorRate = (totalErrors / totalItems) × 100
```

#### 3. Items Per Hour
```
itemsPerHour = totalItems / (totalSeconds / 3600)
```

#### 4. Accuracy Score
```
accuracyScore = 100 - errorRate
```

### Benchmarks
| Metric | Excellent | Good | Needs Improvement |
|--------|-----------|------|-------------------|
| Carts/Hour | ≥ 2.0 | 1.2-2.0 | < 1.2 |
| Error Rate | ≤ 0.5% | 0.5-1.5% | > 1.5% |
| Accuracy | ≥ 99.5% | 99.0-99.5% | < 99.0% |
| Items/Hour | ≥ 70 | 50-70 | < 50 |

---

## 🌱 Sustainability Metrics

### Tracked Metrics

1. **Errors Prevented**
   - Count of errors caught before deployment
   - Reduces food waste and costs

2. **Waste Reduction (kg)**
   - Physical weight of food saved
   - Calculated based on prevented errors

3. **Time Saved (minutes)**
   - Efficiency gains from process optimization
   - Reduced rework time

4. **Cost Savings (USD)**
   - Financial impact of error prevention
   - Includes labor and material costs

5. **Carbon Footprint Reduction (kg CO₂)**
   - Environmental impact of waste prevention
   - Calculated using industry standards

6. **Process Efficiency (%)**
   - Overall system efficiency improvement
   - Compared to baseline metrics

### Calculation Example
```javascript
// Average food waste per error: 0.5 kg
// Average cost per kg: $10
// Carbon footprint per kg: 2.5 kg CO₂

errorsPrevented = 100
wasteReduction = errorsPrevented × 0.5 = 50 kg
costSavings = wasteReduction × 10 = $500
carbonReduction = wasteReduction × 2.5 = 125 kg CO₂
```

---

## 📖 Usage Guide

### For Supervisors

#### Accessing the Dashboard
1. Login with supervisor credentials
2. Navigate to `/dashboard`
3. View the Overview tab by default

#### Monitoring Performance
1. Check key metrics cards at the top
2. Review 30-day performance trends
3. Identify employees needing training
4. Address active alerts

#### Using the AI Assistant
1. Click the floating AI button (bottom right)
2. Use quick actions or type custom questions
3. Review recommendations
4. Save important insights

#### Analyzing Errors
1. Switch to "Error Analysis" tab
2. Review error distribution pie chart
3. Identify problematic error types
4. Check employee error rates

#### Tracking Sustainability
1. Switch to "Sustainability" tab
2. Review impact metrics
3. Share results with stakeholders
4. Set improvement goals

### For Employees

#### Recording Sessions
Sessions are automatically tracked when completing inventory validation:
1. Start inventory process
2. System records: start time, photos taken, items scanned
3. Complete validation
4. System calculates: duration, error rate, performance score

---

## 💻 Development

### Setup

1. **Install Dependencies**
```bash
# Frontend
cd gategroup
npm install recharts date-fns

# Backend
cd backend
npm install
```

2. **Database Setup**
```bash
# Run the analytics tables creation script
# Use Snowflake Web UI or SnowSQL to execute:
# backend/scripts/create_analytics_tables.sql
```

3. **Environment Variables**
```env
# backend/.env
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=GATE_GROUP_INVENTORY
SNOWFLAKE_SCHEMA=MAIN
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
JWT_SECRET=your_jwt_secret
```

4. **Start Servers**
```bash
# Backend
cd backend
node server.js

# Frontend
cd gategroup
npm run dev
```

### Project Structure
```
gategroup-1/
├── backend/
│   ├── models/
│   │   ├── Analytics.js           # Analytics model
│   │   ├── Metrics.js             # Basic metrics
│   │   └── User.js                # User authentication
│   ├── scripts/
│   │   ├── create_analytics_tables.sql
│   │   └── validate_inventory.py
│   └── server.js                  # Express server
│
├── gategroup/
│   ├── src/
│   │   ├── components/
│   │   │   └── AIAssistant.jsx    # AI chat component
│   │   ├── pages/
│   │   │   ├── EnhancedSupervisorDashboard.jsx
│   │   │   └── SupervisorDashboard.jsx
│   │   └── App.jsx                # Routes configuration
│   └── package.json
│
└── ENHANCED_DASHBOARD_DOCUMENTATION.md
```

### Adding New Features

#### 1. Add New Chart
```javascript
// In EnhancedSupervisorDashboard.jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={newData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
    <XAxis dataKey="label" stroke="#9CA3AF" />
    <YAxis stroke="#9CA3AF" />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="value" stroke="#F59E0B" />
  </LineChart>
</ResponsiveContainer>
```

#### 2. Add New Metric
```javascript
// In Analytics.js
static async getNewMetric() {
  const query = `SELECT * FROM NEW_TABLE`;
  const results = await executeQuery(query);
  return results.map(row => ({...}));
}

// In server.js
app.get('/api/analytics/new-metric', authenticateToken, async (req, res) => {
  const data = await Analytics.getNewMetric();
  res.json(data);
});
```

#### 3. Add New Alert Type
```javascript
// Create alert
await Analytics.createAlert({
  alertType: 'NEW_ALERT_TYPE',
  severity: 'HIGH',
  employeeId: 'emp123',
  title: 'Alert Title',
  message: 'Alert description'
});
```

---

## 🎯 HackMTY Evaluation Alignment

### Innovation
- ✅ AI-powered insights and recommendations
- ✅ Real-time performance tracking
- ✅ Sustainability metrics integration
- ✅ Predictive training needs identification

### Technical Implementation
- ✅ Modern React with hooks
- ✅ Responsive design with Tailwind CSS
- ✅ Interactive charts with Recharts
- ✅ RESTful API design
- ✅ Snowflake data warehouse
- ✅ JWT authentication

### User Experience
- ✅ Intuitive tabbed interface
- ✅ Real-time updates (30s refresh)
- ✅ Color-coded metrics
- ✅ Mobile-responsive design
- ✅ AI assistant for guidance

### Business Impact
- ✅ Error reduction tracking
- ✅ Cost savings calculation
- ✅ Waste prevention metrics
- ✅ Performance optimization
- ✅ Training need identification

### Scalability
- ✅ Database indexing for performance
- ✅ Modular component architecture
- ✅ API-first design
- ✅ Efficient data aggregation
- ✅ Background job support

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check backend server logs
4. Verify database connections
5. Test API endpoints individually

---

## 🎉 Success Criteria

The Enhanced Supervisor Dashboard successfully:
- ✅ Provides real-time performance insights
- ✅ Identifies training needs automatically
- ✅ Tracks sustainability impact
- ✅ Offers AI-powered recommendations
- ✅ Reduces errors through monitoring
- ✅ Optimizes workflow efficiency
- ✅ Aligns with HackMTY criteria

---

**Built with ❤️ for HackMTY 2025**
**GateGroup SmartStation - Transforming Airline Catering with AI**

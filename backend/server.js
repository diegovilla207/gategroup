import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Metrics from './models/Metrics.js';
import { generateToken, authenticateToken, requireSupervisor } from './utils/auth.js';
import { testConnection } from './config/snowflake.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true // Allow cookies
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Endpoint para obtener inventario por número de vuelo
app.post('/api/inventory/flight', (req, res) => {
    const { flight_number } = req.body;

    if (!flight_number) {
        return res.status(400).json({ error: 'flight_number es requerido' });
    }

    console.log(`Consultando inventario para vuelo: ${flight_number}`);

    // Ejecutar script de Python
    const pythonProcess = spawn('python3', [
        path.join(__dirname, 'scripts', 'get_inventory.py'),
        flight_number
    ]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Proceso Python terminó con código: ${code}`);
            console.error(`Error: ${errorString}`);
            return res.status(500).json({
                error: 'Error al obtener inventario',
                details: errorString
            });
        }

        try {
            const inventoryData = JSON.parse(dataString);
            res.json(inventoryData);
        } catch (error) {
            console.error('Error al parsear respuesta:', error);
            res.status(500).json({
                error: 'Error al parsear respuesta del inventario',
                raw: dataString
            });
        }
    });
});

// Endpoint para validar inventario escaneado
app.post('/api/inventory/validate', (req, res) => {
    const { flight_number, scanned_data } = req.body;

    if (!flight_number || !scanned_data || !Array.isArray(scanned_data)) {
        return res.status(400).json({
            error: 'flight_number y scanned_data (array) son requeridos'
        });
    }

    console.log(`Validando inventario para vuelo: ${flight_number}`);
    console.log(`Datos escaneados:`, JSON.stringify(scanned_data, null, 2));

    // Ejecutar script de Python para validación
    const pythonProcess = spawn('python3', [
        path.join(__dirname, 'scripts', 'validate_inventory.py'),
        flight_number,
        JSON.stringify(scanned_data)
    ]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Proceso Python terminó con código: ${code}`);
            console.error(`Error: ${errorString}`);
            return res.status(500).json({
                error: 'Error al validar inventario',
                details: errorString
            });
        }

        try {
            const validationResult = JSON.parse(dataString);
            res.json(validationResult);
        } catch (error) {
            console.error('Error al parsear respuesta:', error);
            res.status(500).json({
                error: 'Error al parsear respuesta de validación',
                raw: dataString
            });
        }
    });
});

// ========================
// Authentication Endpoints
// ========================

/**
 * POST /api/auth/login
 * Login endpoint - authenticates user and returns JWT
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Username and password are required'
            });
        }

        // Find user in database
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid username or password'
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Set token in HTTP-only cookie (more secure than localStorage)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Return user info (without password) and token
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email
            }
        });

        console.log(`✅ User logged in: ${username} (${user.role})`);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'An error occurred during login'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout endpoint - clears JWT cookie
 */
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * GET /api/auth/me
 * Get current user info from JWT token
 * Protected route - requires authentication
 */
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        // req.user is set by authenticateToken middleware
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'The authenticated user no longer exists'
            });
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not fetch user information'
        });
    }
});

// ========================
// Supervisor-Only Endpoints
// ========================

/**
 * GET /api/metrics/dashboard
 * Get complete dashboard metrics
 * Supervisor-only route
 */
app.get('/api/metrics/dashboard', authenticateToken, requireSupervisor, async (req, res) => {
    try {
        const dashboardData = await Metrics.getDashboardData();
        res.json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not fetch dashboard metrics'
        });
    }
});

/**
 * GET /api/metrics/productivity
 * Get productivity metrics per employee
 * Supervisor-only route
 */
app.get('/api/metrics/productivity', authenticateToken, requireSupervisor, async (req, res) => {
    try {
        const productivity = await Metrics.getProductivityByEmployee();
        res.json(productivity);
    } catch (error) {
        console.error('Error fetching productivity metrics:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not fetch productivity metrics'
        });
    }
});

/**
 * GET /api/metrics/error-rates
 * Get error rate metrics per employee
 * Supervisor-only route
 */
app.get('/api/metrics/error-rates', authenticateToken, requireSupervisor, async (req, res) => {
    try {
        const errorRates = await Metrics.getErrorRateByEmployee();
        res.json(errorRates);
    } catch (error) {
        console.error('Error fetching error rate metrics:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not fetch error rate metrics'
        });
    }
});

/**
 * GET /api/metrics/efficiency
 * Get overall line efficiency metrics
 * Supervisor-only route
 */
app.get('/api/metrics/efficiency', authenticateToken, requireSupervisor, async (req, res) => {
    try {
        const efficiency = await Metrics.getOverallEfficiency();
        res.json(efficiency);
    } catch (error) {
        console.error('Error fetching efficiency metrics:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not fetch efficiency metrics'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running' });
});

// Test Snowflake connection on startup
app.listen(PORT, async () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`\n📦 Endpoints disponibles:`);
    console.log(`   Authentication:`);
    console.log(`     POST /api/auth/login - User login`);
    console.log(`     POST /api/auth/logout - User logout`);
    console.log(`     GET  /api/auth/me - Get current user info (protected)`);
    console.log(`\n   Supervisor Metrics (protected):`);
    console.log(`     GET  /api/metrics/dashboard - Complete dashboard data`);
    console.log(`     GET  /api/metrics/productivity - Productivity by employee`);
    console.log(`     GET  /api/metrics/error-rates - Error rates by employee`);
    console.log(`     GET  /api/metrics/efficiency - Overall efficiency metrics`);
    console.log(`\n   Inventory:`);
    console.log(`     POST /api/inventory/flight - Obtener inventario por número de vuelo`);
    console.log(`     POST /api/inventory/validate - Validar inventario escaneado`);
    console.log(`\n   System:`);
    console.log(`     GET  /api/health - Health check`);

    // Test Snowflake connection
    console.log(`\n🔌 Testing Snowflake connection...`);
    await testConnection();
});

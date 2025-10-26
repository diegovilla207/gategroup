import jwt from 'jsonwebtoken';

// JWT Secret - In production, this should be a strong secret stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '24h'; // Token expires in 24 hours

/**
 * Generate JWT token for user
 * @param {Object} user - User object {id, username, role}
 * @returns {string} JWT token
 */
export function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

/**
 * Middleware to authenticate requests
 * Checks for JWT in Authorization header or cookies
 */
export function authenticateToken(req, res, next) {
    // Check Authorization header first
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Check cookies as fallback
    const cookieToken = req.cookies?.token;

    const token = headerToken || cookieToken;

    if (!token) {
        return res.status(401).json({
            error: 'Access denied',
            message: 'No authentication token provided'
        });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(403).json({
            error: 'Invalid token',
            message: 'The provided token is invalid or expired'
        });
    }

    // Attach user info to request
    req.user = decoded;
    next();
}

/**
 * Middleware to check if user has required role
 * @param  {...string} allowedRoles - Roles that are allowed
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
}

/**
 * Middleware specifically for supervisor-only routes
 */
export function requireSupervisor(req, res, next) {
    return requireRole('supervisor')(req, res, next);
}

export default {
    generateToken,
    verifyToken,
    authenticateToken,
    requireRole,
    requireSupervisor
};

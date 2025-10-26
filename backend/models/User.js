import { executeQuery } from '../config/snowflake.js';
import bcrypt from 'bcryptjs';

/**
 * User model for authentication and user management
 */
export class User {
    /**
     * Find a user by username
     * @param {string} username
     * @returns {Promise<Object|null>} User object or null
     */
    static async findByUsername(username) {
        try {
            // Test credentials for development
            // Pre-hashed passwords (bcrypt hashes for 'employee123' and 'supervisor123')
            if (username === 'employee@gategroup.com') {
                return {
                    id: 'z9y8x7w6-v5u4-3210-zyxw-222222222222',
                    username: 'employee@gategroup.com',
                    passwordHash: '$2b$10$omWVBNKhInrccvn9ET9TCOUSuq9l4iRisMG6.KV910rINRMmcK9B6',
                    role: 'employee',
                    fullName: 'Test Employee',
                    email: 'employee@gategroup.com',
                    createdAt: new Date()
                };
            }

            if (username === 'supervisor@gategroup.com') {
                return {
                    id: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
                    username: 'supervisor@gategroup.com',
                    passwordHash: '$2b$10$ZixGV.ue54arZOVIZjgok.xBq59YllH5tXpaLG98xIO8u94.Tpz/m',
                    role: 'supervisor',
                    fullName: 'Test Supervisor',
                    email: 'supervisor@gategroup.com',
                    createdAt: new Date()
                };
            }

            // Regular database query for production
            const query = `
                SELECT
                    USER_ID,
                    USERNAME,
                    PASSWORD_HASH,
                    ROLE,
                    FULL_NAME,
                    EMAIL,
                    CREATED_AT
                FROM USERS
                WHERE USERNAME = ?
            `;

            const results = await executeQuery(query, [username]);

            if (results.length === 0) {
                return null;
            }

            return {
                id: results[0].USER_ID,
                username: results[0].USERNAME,
                passwordHash: results[0].PASSWORD_HASH,
                role: results[0].ROLE,
                fullName: results[0].FULL_NAME,
                email: results[0].EMAIL,
                createdAt: results[0].CREATED_AT
            };
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    /**
     * Find a user by ID
     * @param {number} userId
     * @returns {Promise<Object|null>} User object or null
     */
    static async findById(userId) {
        try {
            const query = `
                SELECT
                    USER_ID,
                    USERNAME,
                    ROLE,
                    FULL_NAME,
                    EMAIL,
                    CREATED_AT
                FROM USERS
                WHERE USER_ID = ?
            `;

            const results = await executeQuery(query, [userId]);

            if (results.length === 0) {
                return null;
            }

            return {
                id: results[0].USER_ID,
                username: results[0].USERNAME,
                role: results[0].ROLE,
                fullName: results[0].FULL_NAME,
                email: results[0].EMAIL,
                createdAt: results[0].CREATED_AT
            };
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * Verify user password
     * @param {string} password - Plain text password
     * @param {string} passwordHash - Hashed password from database
     * @returns {Promise<boolean>}
     */
    static async verifyPassword(password, passwordHash) {
        return bcrypt.compare(password, passwordHash);
    }

    /**
     * Create a new user
     * @param {Object} userData - User data {username, password, role, fullName, email}
     * @returns {Promise<Object>} Created user object
     */
    static async create(userData) {
        try {
            const { username, password, role, fullName, email } = userData;

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            const query = `
                INSERT INTO USERS (USERNAME, PASSWORD_HASH, ROLE, FULL_NAME, EMAIL)
                VALUES (?, ?, ?, ?, ?)
            `;

            await executeQuery(query, [username, passwordHash, role, fullName, email]);

            // Fetch and return the created user
            return await this.findByUsername(username);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Get all users (excluding passwords)
     * @returns {Promise<Array>} Array of user objects
     */
    static async findAll() {
        try {
            const query = `
                SELECT
                    USER_ID,
                    USERNAME,
                    ROLE,
                    FULL_NAME,
                    EMAIL,
                    CREATED_AT
                FROM USERS
                ORDER BY CREATED_AT DESC
            `;

            const results = await executeQuery(query);

            return results.map(row => ({
                id: row.USER_ID,
                username: row.USERNAME,
                role: row.ROLE,
                fullName: row.FULL_NAME,
                email: row.EMAIL,
                createdAt: row.CREATED_AT
            }));
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }
}

export default User;

import { executeQuery } from '../config/snowflake.js';

/**
 * Metrics model for supervisor dashboard
 * Tracks employee productivity, error rates, and efficiency
 */
export class Metrics {
    /**
     * Get productivity metrics per employee (drawers completed per hour)
     * @param {Date} startDate - Start date for metrics
     * @param {Date} endDate - End date for metrics
     * @returns {Promise<Array>} Productivity data per employee
     */
    static async getProductivityByEmployee(startDate = null, endDate = null) {
        try {
            // If dates not provided, default to last 7 days
            if (!startDate) {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
            }
            if (!endDate) {
                endDate = new Date();
            }

            const query = `
                SELECT
                    u.USERNAME,
                    u.FULL_NAME,
                    COUNT(d.DRAWER_ID) as TOTAL_DRAWERS_COMPLETED,
                    SUM(TIMESTAMPDIFF(HOUR, d.START_TIME, d.END_TIME)) as TOTAL_HOURS_WORKED,
                    ROUND(COUNT(d.DRAWER_ID) / NULLIF(SUM(TIMESTAMPDIFF(HOUR, d.START_TIME, d.END_TIME)), 0), 2) as DRAWERS_PER_HOUR
                FROM USERS u
                LEFT JOIN DRAWER_COMPLETIONS d ON u.USER_ID = d.USER_ID
                WHERE u.ROLE = 'employee'
                    AND d.COMPLETION_DATE BETWEEN ? AND ?
                GROUP BY u.USERNAME, u.FULL_NAME
                ORDER BY DRAWERS_PER_HOUR DESC
            `;

            const results = await executeQuery(query, [startDate, endDate]);

            return results.map(row => ({
                username: row.USERNAME,
                fullName: row.FULL_NAME,
                totalDrawersCompleted: row.TOTAL_DRAWERS_COMPLETED,
                totalHoursWorked: row.TOTAL_HOURS_WORKED,
                drawersPerHour: row.DRAWERS_PER_HOUR || 0
            }));
        } catch (error) {
            console.error('Error fetching productivity metrics:', error);
            // Return mock data if table doesn't exist yet
            return this.getMockProductivityData();
        }
    }

    /**
     * Get average error rate per employee
     * @returns {Promise<Array>} Error rate data per employee
     */
    static async getErrorRateByEmployee() {
        try {
            const query = `
                SELECT
                    u.USERNAME,
                    u.FULL_NAME,
                    COUNT(CASE WHEN i.STATUS = 'error' THEN 1 END) as TOTAL_ERRORS,
                    COUNT(i.ITEM_ID) as TOTAL_ITEMS,
                    ROUND((COUNT(CASE WHEN i.STATUS = 'error' THEN 1 END) * 100.0) / NULLIF(COUNT(i.ITEM_ID), 0), 2) as ERROR_RATE_PERCENT
                FROM USERS u
                LEFT JOIN INVENTORY_SCANS i ON u.USER_ID = i.USER_ID
                WHERE u.ROLE = 'employee'
                GROUP BY u.USERNAME, u.FULL_NAME
                ORDER BY ERROR_RATE_PERCENT ASC
            `;

            const results = await executeQuery(query);

            return results.map(row => ({
                username: row.USERNAME,
                fullName: row.FULL_NAME,
                totalErrors: row.TOTAL_ERRORS,
                totalItems: row.TOTAL_ITEMS,
                errorRatePercent: row.ERROR_RATE_PERCENT || 0
            }));
        } catch (error) {
            console.error('Error fetching error rate metrics:', error);
            // Return mock data if table doesn't exist yet
            return this.getMockErrorRateData();
        }
    }

    /**
     * Get overall line efficiency metrics
     * @returns {Promise<Object>} Overall efficiency data
     */
    static async getOverallEfficiency() {
        try {
            const query = `
                SELECT
                    COUNT(DISTINCT u.USER_ID) as TOTAL_EMPLOYEES,
                    COUNT(d.DRAWER_ID) as TOTAL_DRAWERS_COMPLETED,
                    SUM(TIMESTAMPDIFF(HOUR, d.START_TIME, d.END_TIME)) as TOTAL_HOURS,
                    ROUND(COUNT(d.DRAWER_ID) / NULLIF(SUM(TIMESTAMPDIFF(HOUR, d.START_TIME, d.END_TIME)), 0), 2) as AVG_DRAWERS_PER_HOUR,
                    COUNT(CASE WHEN i.STATUS = 'error' THEN 1 END) as TOTAL_ERRORS,
                    COUNT(i.ITEM_ID) as TOTAL_ITEMS_SCANNED,
                    ROUND((COUNT(CASE WHEN i.STATUS = 'error' THEN 1 END) * 100.0) / NULLIF(COUNT(i.ITEM_ID), 0), 2) as OVERALL_ERROR_RATE
                FROM USERS u
                LEFT JOIN DRAWER_COMPLETIONS d ON u.USER_ID = d.USER_ID
                LEFT JOIN INVENTORY_SCANS i ON u.USER_ID = i.USER_ID
                WHERE u.ROLE = 'employee'
            `;

            const results = await executeQuery(query);

            if (results.length === 0) {
                return this.getMockOverallEfficiency();
            }

            const row = results[0];
            return {
                totalEmployees: row.TOTAL_EMPLOYEES,
                totalDrawersCompleted: row.TOTAL_DRAWERS_COMPLETED,
                totalHours: row.TOTAL_HOURS,
                avgDrawersPerHour: row.AVG_DRAWERS_PER_HOUR || 0,
                totalErrors: row.TOTAL_ERRORS,
                totalItemsScanned: row.TOTAL_ITEMS_SCANNED,
                overallErrorRate: row.OVERALL_ERROR_RATE || 0
            };
        } catch (error) {
            console.error('Error fetching overall efficiency:', error);
            // Return mock data if table doesn't exist yet
            return this.getMockOverallEfficiency();
        }
    }

    /**
     * Get comprehensive dashboard data for supervisors
     * @returns {Promise<Object>} Complete dashboard data
     */
    static async getDashboardData() {
        try {
            const [productivity, errorRates, efficiency] = await Promise.all([
                this.getProductivityByEmployee(),
                this.getErrorRateByEmployee(),
                this.getOverallEfficiency()
            ]);

            return {
                productivity,
                errorRates,
                efficiency,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    // Mock data methods for development/testing
    static getMockProductivityData() {
        return [
            { username: 'john_doe', fullName: 'John Doe', totalDrawersCompleted: 45, totalHoursWorked: 40, drawersPerHour: 1.13 },
            { username: 'jane_smith', fullName: 'Jane Smith', totalDrawersCompleted: 52, totalHoursWorked: 40, drawersPerHour: 1.30 },
            { username: 'bob_johnson', fullName: 'Bob Johnson', totalDrawersCompleted: 38, totalHoursWorked: 40, drawersPerHour: 0.95 },
            { username: 'alice_williams', fullName: 'Alice Williams', totalDrawersCompleted: 48, totalHoursWorked: 40, drawersPerHour: 1.20 }
        ];
    }

    static getMockErrorRateData() {
        return [
            { username: 'john_doe', fullName: 'John Doe', totalErrors: 3, totalItems: 450, errorRatePercent: 0.67 },
            { username: 'jane_smith', fullName: 'Jane Smith', totalErrors: 5, totalItems: 520, errorRatePercent: 0.96 },
            { username: 'bob_johnson', fullName: 'Bob Johnson', totalErrors: 8, totalItems: 380, errorRatePercent: 2.11 },
            { username: 'alice_williams', fullName: 'Alice Williams', totalErrors: 4, totalItems: 480, errorRatePercent: 0.83 }
        ];
    }

    static getMockOverallEfficiency() {
        return {
            totalEmployees: 4,
            totalDrawersCompleted: 183,
            totalHours: 160,
            avgDrawersPerHour: 1.14,
            totalErrors: 20,
            totalItemsScanned: 1830,
            overallErrorRate: 1.09
        };
    }
}

export default Metrics;

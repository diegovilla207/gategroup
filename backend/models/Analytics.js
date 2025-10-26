import { executeQuery } from '../config/snowflake.js';

/**
 * Analytics model for supervisor dashboard
 * Handles performance tracking, metrics, and AI insights
 */
export class Analytics {
    /**
     * Get enhanced dashboard data with charts and trends
     */
    static async getEnhancedDashboard() {
        try {
            const [
                performanceTrends,
                errorDistribution,
                employeeMetrics,
                alerts,
                sustainabilityMetrics
            ] = await Promise.all([
                this.getPerformanceTrends(),
                this.getErrorDistribution(),
                this.getEmployeeMetrics(),
                this.getActiveAlerts(),
                this.getSustainabilityMetrics()
            ]);

            return {
                performanceTrends,
                errorDistribution,
                employeeMetrics,
                alerts,
                sustainabilityMetrics,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching enhanced dashboard:', error);
            throw error;
        }
    }

    /**
     * Get performance trends for last 30 days
     */
    static async getPerformanceTrends() {
        const query = `
            SELECT
                METRIC_DATE,
                TOTAL_SESSIONS,
                ACTIVE_EMPLOYEES,
                TOTAL_ITEMS,
                TOTAL_ERRORS,
                ERROR_RATE,
                AVG_SESSION_MINUTES
            FROM VW_DAILY_PERFORMANCE_TRENDS
            ORDER BY METRIC_DATE DESC
            LIMIT 30
        `;

        try {
            const results = await executeQuery(query);
            return results.map(row => ({
                date: row.METRIC_DATE,
                sessions: row.TOTAL_SESSIONS,
                employees: row.ACTIVE_EMPLOYEES,
                items: row.TOTAL_ITEMS,
                errors: row.TOTAL_ERRORS,
                errorRate: parseFloat(row.ERROR_RATE),
                avgTime: parseFloat(row.AVG_SESSION_MINUTES)
            }));
        } catch (error) {
            console.error('Error fetching performance trends:', error);
            return [];
        }
    }

    /**
     * Get error type distribution
     */
    static async getErrorDistribution() {
        const query = `
            SELECT
                ERROR_TYPE,
                ERROR_COUNT,
                PERCENTAGE,
                CRITICAL_PERCENT
            FROM VW_ERROR_TYPE_DISTRIBUTION
        `;

        try {
            const results = await executeQuery(query);
            return results.map(row => ({
                type: row.ERROR_TYPE,
                count: row.ERROR_COUNT,
                percentage: parseFloat(row.PERCENTAGE),
                criticalPercent: parseFloat(row.CRITICAL_PERCENT)
            }));
        } catch (error) {
            console.error('Error fetching error distribution:', error);
            return [];
        }
    }

    /**
     * Get detailed employee metrics
     */
    static async getEmployeeMetrics() {
        const query = `
            SELECT
                EMPLOYEE_ID,
                USERNAME,
                FULL_NAME,
                TOTAL_SESSIONS,
                TOTAL_ITEMS,
                TOTAL_ERRORS,
                AVG_SESSION_DURATION,
                ERROR_RATE,
                ITEMS_PER_HOUR,
                ACCURACY_SCORE
            FROM VW_EMPLOYEE_PERFORMANCE_7D
            ORDER BY ITEMS_PER_HOUR DESC
        `;

        try {
            const results = await executeQuery(query);
            return results.map(row => ({
                employeeId: row.EMPLOYEE_ID,
                username: row.USERNAME,
                fullName: row.FULL_NAME,
                sessions: row.TOTAL_SESSIONS,
                items: row.TOTAL_ITEMS,
                errors: row.TOTAL_ERRORS,
                avgDuration: parseFloat(row.AVG_SESSION_DURATION),
                errorRate: parseFloat(row.ERROR_RATE),
                itemsPerHour: parseFloat(row.ITEMS_PER_HOUR),
                accuracyScore: parseFloat(row.ACCURACY_SCORE),
                performanceScore: this.calculatePerformanceScore(
                    parseFloat(row.ITEMS_PER_HOUR),
                    parseFloat(row.ERROR_RATE),
                    parseFloat(row.ACCURACY_SCORE)
                )
            }));
        } catch (error) {
            console.error('Error fetching employee metrics:', error);
            return [];
        }
    }

    /**
     * Get active alerts
     */
    static async getActiveAlerts() {
        const query = `
            SELECT
                ALERT_ID,
                ALERT_TYPE,
                SEVERITY,
                EMPLOYEE_ID,
                TITLE,
                MESSAGE,
                STATUS,
                CREATED_AT
            FROM REAL_TIME_ALERTS
            WHERE STATUS = 'ACTIVE'
            ORDER BY
                CASE SEVERITY
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                END,
                CREATED_AT DESC
            LIMIT 20
        `;

        try {
            const results = await executeQuery(query);
            return results.map(row => ({
                id: row.ALERT_ID,
                type: row.ALERT_TYPE,
                severity: row.SEVERITY,
                employeeId: row.EMPLOYEE_ID,
                title: row.TITLE,
                message: row.MESSAGE,
                status: row.STATUS,
                createdAt: row.CREATED_AT
            }));
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
    }

    /**
     * Get sustainability metrics
     */
    static async getSustainabilityMetrics() {
        const query = `
            SELECT
                ERRORS_PREVENTED,
                WASTE_REDUCTION_KG,
                TIME_SAVED_MINUTES,
                PROCESS_EFFICIENCY_PERCENT,
                COST_SAVINGS_USD,
                CARBON_FOOTPRINT_REDUCTION_KG
            FROM SUSTAINABILITY_METRICS
            WHERE METRIC_DATE >= DATEADD(DAY, -30, CURRENT_DATE())
            ORDER BY METRIC_DATE DESC
        `;

        try {
            const results = await executeQuery(query);
            if (results.length === 0) return null;

            // Sum up the metrics
            const totals = results.reduce((acc, row) => ({
                errorsPrevented: acc.errorsPrevented + row.ERRORS_PREVENTED,
                wasteReduction: acc.wasteReduction + parseFloat(row.WASTE_REDUCTION_KG),
                timeSaved: acc.timeSaved + row.TIME_SAVED_MINUTES,
                efficiency: Math.max(acc.efficiency, parseFloat(row.PROCESS_EFFICIENCY_PERCENT)),
                costSavings: acc.costSavings + parseFloat(row.COST_SAVINGS_USD),
                carbonReduction: acc.carbonReduction + parseFloat(row.CARBON_FOOTPRINT_REDUCTION_KG)
            }), {
                errorsPrevented: 0,
                wasteReduction: 0,
                timeSaved: 0,
                efficiency: 0,
                costSavings: 0,
                carbonReduction: 0
            });

            return totals;
        } catch (error) {
            console.error('Error fetching sustainability metrics:', error);
            return null;
        }
    }

    /**
     * Record inventory session for analytics
     */
    static async recordInventorySession(sessionData) {
        const {
            sessionId,
            flightNumber,
            cartId,
            employeeId,
            startTime,
            endTime,
            photosTaken,
            itemsScanned,
            errorsDetected,
            status
        } = sessionData;

        const durationSeconds = endTime && startTime ?
            Math.floor((new Date(endTime) - new Date(startTime)) / 1000) : null;

        const query = `
            INSERT INTO INVENTORY_SESSIONS (
                SESSION_ID, FLIGHT_NUMBER, CART_ID, EMPLOYEE_ID,
                START_TIME, END_TIME, DURATION_SECONDS,
                PHOTOS_TAKEN, ITEMS_SCANNED, ERRORS_DETECTED, STATUS
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            await executeQuery(query, [
                sessionId,
                flightNumber,
                cartId,
                employeeId,
                startTime,
                endTime,
                durationSeconds,
                photosTaken || 0,
                itemsScanned || 0,
                errorsDetected || 0,
                status || 'COMPLETED'
            ]);

            return { success: true, sessionId };
        } catch (error) {
            console.error('Error recording inventory session:', error);
            throw error;
        }
    }

    /**
     * Log an error for analysis
     */
    static async logError(errorData) {
        const {
            sessionId,
            employeeId,
            flightNumber,
            cartId,
            errorType,
            description,
            productSku,
            expectedValue,
            actualValue,
            severity
        } = errorData;

        const query = `
            INSERT INTO ERROR_LOG (
                SESSION_ID, EMPLOYEE_ID, FLIGHT_NUMBER, CART_ID,
                ERROR_TYPE, ERROR_DESCRIPTION, PRODUCT_SKU,
                EXPECTED_VALUE, ACTUAL_VALUE, SEVERITY
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            await executeQuery(query, [
                sessionId,
                employeeId,
                flightNumber,
                cartId,
                errorType,
                description,
                productSku,
                expectedValue,
                actualValue,
                severity || 'MEDIUM'
            ]);

            return { success: true };
        } catch (error) {
            console.error('Error logging error:', error);
            throw error;
        }
    }

    /**
     * Get training needs for employees
     */
    static async getTrainingNeeds() {
        const query = `
            SELECT
                TRAINING_ID,
                EMPLOYEE_ID,
                SKILL_AREA,
                PRIORITY,
                CURRENT_SCORE,
                TARGET_SCORE,
                STATUS,
                NOTES
            FROM TRAINING_NEEDS
            WHERE STATUS IN ('PENDING', 'IN_PROGRESS')
            ORDER BY
                CASE PRIORITY
                    WHEN 'URGENT' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                END,
                IDENTIFIED_DATE DESC
        `;

        try {
            const results = await executeQuery(query);
            return results.map(row => ({
                id: row.TRAINING_ID,
                employeeId: row.EMPLOYEE_ID,
                skillArea: row.SKILL_AREA,
                priority: row.PRIORITY,
                currentScore: parseFloat(row.CURRENT_SCORE),
                targetScore: parseFloat(row.TARGET_SCORE),
                status: row.STATUS,
                notes: row.NOTES
            }));
        } catch (error) {
            console.error('Error fetching training needs:', error);
            return [];
        }
    }

    /**
     * Save AI chat interaction
     */
    static async saveChatInteraction(chatData) {
        const {
            sessionId,
            userId,
            userMessage,
            aiResponse,
            contextData,
            sentiment,
            actionTaken
        } = chatData;

        const query = `
            INSERT INTO AI_CHAT_HISTORY (
                SESSION_ID, USER_ID, USER_MESSAGE, AI_RESPONSE,
                CONTEXT_DATA, SENTIMENT, ACTION_TAKEN
            ) VALUES (?, ?, ?, ?, PARSE_JSON(?), ?, ?)
        `;

        try {
            await executeQuery(query, [
                sessionId,
                userId,
                userMessage,
                aiResponse,
                JSON.stringify(contextData || {}),
                sentiment,
                actionTaken
            ]);

            return { success: true };
        } catch (error) {
            console.error('Error saving chat interaction:', error);
            throw error;
        }
    }

    /**
     * Calculate performance score
     */
    static calculatePerformanceScore(itemsPerHour, errorRate, accuracyScore) {
        // Weighted scoring: Speed (30%), Accuracy (50%), Error Rate (20%)
        const speedScore = Math.min(itemsPerHour / 70 * 100, 100);
        const accuracyWeight = accuracyScore;
        const errorPenalty = Math.max(0, 100 - (errorRate * 50));

        const finalScore = (speedScore * 0.3) + (accuracyWeight * 0.5) + (errorPenalty * 0.2);
        return Math.round(finalScore * 100) / 100;
    }

    /**
     * Create alert
     */
    static async createAlert(alertData) {
        const {
            alertType,
            severity,
            employeeId,
            title,
            message
        } = alertData;

        const query = `
            INSERT INTO REAL_TIME_ALERTS (
                ALERT_TYPE, SEVERITY, EMPLOYEE_ID, TITLE, MESSAGE
            ) VALUES (?, ?, ?, ?, ?)
        `;

        try {
            await executeQuery(query, [
                alertType,
                severity || 'MEDIUM',
                employeeId,
                title,
                message
            ]);

            return { success: true };
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    /**
     * Acknowledge alert
     */
    static async acknowledgeAlert(alertId) {
        const query = `
            UPDATE REAL_TIME_ALERTS
            SET STATUS = 'ACKNOWLEDGED',
                ACKNOWLEDGED_AT = CURRENT_TIMESTAMP()
            WHERE ALERT_ID = ?
        `;

        try {
            await executeQuery(query, [alertId]);
            return { success: true };
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            throw error;
        }
    }
}

export default Analytics;

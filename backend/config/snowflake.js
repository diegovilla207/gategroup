import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create a Snowflake connection
 * @returns {Promise<Connection>} Snowflake connection object
 */
export function createConnection() {
    return snowflake.createConnection({
        account: process.env.SNOWFLAKE_ACCOUNT,
        username: process.env.SNOWFLAKE_USER,
        password: process.env.SNOWFLAKE_PASSWORD,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
        database: process.env.SNOWFLAKE_DATABASE,
        schema: process.env.SNOWFLAKE_SCHEMA,
    });
}

/**
 * Execute a query on Snowflake
 * @param {string} query - SQL query to execute
 * @param {Array} binds - Array of bind parameters
 * @returns {Promise<Array>} Query results
 */
export function executeQuery(query, binds = []) {
    return new Promise((resolve, reject) => {
        const connection = createConnection();

        connection.connect((err, conn) => {
            if (err) {
                console.error('Unable to connect to Snowflake:', err.message);
                return reject(err);
            }

            conn.execute({
                sqlText: query,
                binds: binds,
                complete: (err, stmt, rows) => {
                    // Close connection after query completes
                    connection.destroy((destroyErr) => {
                        if (destroyErr) {
                            console.error('Unable to disconnect from Snowflake:', destroyErr.message);
                        }
                    });

                    if (err) {
                        console.error('Failed to execute statement:', err.message);
                        return reject(err);
                    }

                    resolve(rows || []);
                }
            });
        });
    });
}

/**
 * Test Snowflake connection
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
    try {
        const result = await executeQuery('SELECT CURRENT_VERSION()');
        console.log('✅ Snowflake connection successful:', result[0]);
        return true;
    } catch (error) {
        console.error('❌ Snowflake connection failed:', error.message);
        return false;
    }
}

export default {
    createConnection,
    executeQuery,
    testConnection
};

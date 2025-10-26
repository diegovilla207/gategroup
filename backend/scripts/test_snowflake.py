import snowflake.connector
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def test_snowflake_connection():
    try:
        # Create a connection with modified parameters
        conn = snowflake.connector.connect(
            user=os.getenv('SNOWFLAKE_USER').strip('"'),
            password=os.getenv('SNOWFLAKE_PASSWORD').strip('"'),
            account='cucbppa-am55842',  # Just the account identifier
            warehouse=os.getenv('SNOWFLAKE_WAREHOUSE').strip('"'),
            database=os.getenv('SNOWFLAKE_DATABASE').strip('"'),
            schema=os.getenv('SNOWFLAKE_SCHEMA').strip('"')
        )
        
        # Create a cursor
        cur = conn.cursor()
        
        # Test query
        cur.execute('SELECT CURRENT_VERSION()')
        version = cur.fetchone()[0]
        print("Successfully connected to Snowflake!")
        print(f"Snowflake Version: {version}")
        
    except Exception as e:
        print("Error connecting to Snowflake:")
        print(str(e))
        
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    test_snowflake_connection()
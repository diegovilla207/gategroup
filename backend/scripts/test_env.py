from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Print environment variables
print("Testing Snowflake Environment Variables:")
print("-" * 40)
print(f"SNOWFLAKE_USER: {os.getenv('SNOWFLAKE_USER')}")
print(f"SNOWFLAKE_ACCOUNT: {os.getenv('SNOWFLAKE_ACCOUNT')}")
print(f"SNOWFLAKE_DATABASE: {os.getenv('SNOWFLAKE_DATABASE')}")
print("-" * 40)
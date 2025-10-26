#!/usr/bin/env python3
"""
Initialize Snowflake Database with Authentication Tables
This script creates the necessary tables for the authentication system and inserts demo users.
"""

import sys
import os
from dotenv import load_dotenv
import snowflake.connector
import bcrypt

# Load environment variables
load_dotenv()

def get_connection():
    """Create and return a Snowflake connection"""
    return snowflake.connector.connect(
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
        database=os.getenv('SNOWFLAKE_DATABASE'),
        schema=os.getenv('SNOWFLAKE_SCHEMA')
    )

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_users_table(cursor):
    """Create the USERS table"""
    print("Creating USERS table...")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS USERS (
            USER_ID INTEGER AUTOINCREMENT PRIMARY KEY,
            USERNAME VARCHAR(50) UNIQUE NOT NULL,
            PASSWORD_HASH VARCHAR(255) NOT NULL,
            ROLE VARCHAR(20) NOT NULL,
            FULL_NAME VARCHAR(100),
            EMAIL VARCHAR(100),
            CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
            UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
    """)

    print("✓ USERS table created successfully")

def create_drawer_completions_table(cursor):
    """Create the DRAWER_COMPLETIONS table for productivity tracking"""
    print("Creating DRAWER_COMPLETIONS table...")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS DRAWER_COMPLETIONS (
            DRAWER_ID INTEGER AUTOINCREMENT PRIMARY KEY,
            USER_ID INTEGER NOT NULL,
            START_TIME TIMESTAMP_NTZ,
            END_TIME TIMESTAMP_NTZ,
            COMPLETION_DATE DATE,
            ITEMS_COUNT INTEGER,
            CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
            FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
        )
    """)

    print("✓ DRAWER_COMPLETIONS table created successfully")

def create_inventory_scans_table(cursor):
    """Create the INVENTORY_SCANS table for error tracking"""
    print("Creating INVENTORY_SCANS table...")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS INVENTORY_SCANS (
            SCAN_ID INTEGER AUTOINCREMENT PRIMARY KEY,
            USER_ID INTEGER NOT NULL,
            ITEM_ID VARCHAR(50) NOT NULL,
            STATUS VARCHAR(20),
            SCAN_TIME TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
            FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
        )
    """)

    print("✓ INVENTORY_SCANS table created successfully")

def insert_demo_users(cursor):
    """Insert demo users into the database"""
    print("\nInserting demo users...")

    # Demo users with hashed passwords
    demo_users = [
        {
            'username': 'supervisor',
            'password': 'password123',
            'role': 'supervisor',
            'full_name': 'Sarah Johnson',
            'email': 'supervisor@gategroup.com'
        },
        {
            'username': 'employee',
            'password': 'password123',
            'role': 'employee',
            'full_name': 'John Doe',
            'email': 'john.doe@gategroup.com'
        },
        {
            'username': 'jane_smith',
            'password': 'password123',
            'role': 'employee',
            'full_name': 'Jane Smith',
            'email': 'jane.smith@gategroup.com'
        },
        {
            'username': 'bob_johnson',
            'password': 'password123',
            'role': 'employee',
            'full_name': 'Bob Johnson',
            'email': 'bob.johnson@gategroup.com'
        },
        {
            'username': 'alice_williams',
            'password': 'password123',
            'role': 'employee',
            'full_name': 'Alice Williams',
            'email': 'alice.williams@gategroup.com'
        }
    ]

    for user in demo_users:
        try:
            password_hash = hash_password(user['password'])

            cursor.execute("""
                INSERT INTO USERS (USERNAME, PASSWORD_HASH, ROLE, FULL_NAME, EMAIL)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                user['username'],
                password_hash,
                user['role'],
                user['full_name'],
                user['email']
            ))

            print(f"  ✓ Created user: {user['username']} ({user['role']})")
        except Exception as e:
            if 'Duplicate key' in str(e) or 'already exists' in str(e):
                print(f"  ⊘ User {user['username']} already exists, skipping...")
            else:
                print(f"  ✗ Error creating user {user['username']}: {e}")

def insert_demo_metrics_data(cursor):
    """Insert demo metrics data for testing"""
    print("\nInserting demo metrics data...")

    try:
        # Insert demo drawer completions
        cursor.execute("""
            INSERT INTO DRAWER_COMPLETIONS (USER_ID, START_TIME, END_TIME, COMPLETION_DATE, ITEMS_COUNT)
            SELECT
                u.USER_ID,
                DATEADD(hour, -8, CURRENT_TIMESTAMP()),
                CURRENT_TIMESTAMP(),
                CURRENT_DATE(),
                45
            FROM USERS u
            WHERE u.USERNAME = 'employee' AND u.ROLE = 'employee'
            LIMIT 1
        """)

        # Insert demo inventory scans
        cursor.execute("""
            INSERT INTO INVENTORY_SCANS (USER_ID, ITEM_ID, STATUS)
            SELECT
                u.USER_ID,
                'ITEM-' || SEQ4() AS ITEM_ID,
                CASE WHEN UNIFORM(1, 100, RANDOM()) > 95 THEN 'error' ELSE 'success' END
            FROM USERS u, TABLE(GENERATOR(ROWCOUNT => 50))
            WHERE u.ROLE = 'employee'
        """)

        print("  ✓ Demo metrics data inserted successfully")
    except Exception as e:
        print(f"  ⊘ Demo data may already exist or error occurred: {e}")

def main():
    """Main function to initialize the database"""
    print("=" * 60)
    print("Snowflake Database Initialization Script")
    print("GateGroup SmartStation - Authentication System")
    print("=" * 60)

    try:
        # Connect to Snowflake
        print("\n🔌 Connecting to Snowflake...")
        conn = get_connection()
        cursor = conn.cursor()
        print("✓ Connected successfully\n")

        # Create tables
        print("Creating tables...")
        print("-" * 60)
        create_users_table(cursor)
        create_drawer_completions_table(cursor)
        create_inventory_scans_table(cursor)

        # Insert demo users
        print("-" * 60)
        insert_demo_users(cursor)

        # Insert demo metrics data
        print("-" * 60)
        insert_demo_metrics_data(cursor)

        # Commit changes
        conn.commit()

        print("\n" + "=" * 60)
        print("✅ Database initialization completed successfully!")
        print("=" * 60)
        print("\n📋 Demo Credentials:")
        print("   Supervisor: supervisor / password123")
        print("   Employee:   employee / password123")
        print("\n💡 You can now start the backend server and login to the application.\n")

    except Exception as e:
        print(f"\n❌ Error initializing database: {e}")
        sys.exit(1)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
            print("🔌 Disconnected from Snowflake")

if __name__ == "__main__":
    main()

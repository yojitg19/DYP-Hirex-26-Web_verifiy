#!/usr/bin/env python3
"""
Script to create an admin user for the Identity Verification System
"""
import sqlite3
import hashlib
from werkzeug.security import generate_password_hash

def create_admin_user():
    # Connect to database
    conn = sqlite3.connect('identity.db')
    cursor = conn.cursor()

    # Admin user details
    email = 'admin@example.com'
    password = 'admin123'  # In production, use a strong password
    hashed_password = generate_password_hash(password)

    # Insert admin user
    cursor.execute('''
        INSERT INTO users (email, password_hash, is_admin, trust_score, created_at)
        VALUES (?, ?, 1, 100, datetime('now'))
    ''', (email, hashed_password))

    conn.commit()
    conn.close()

    print(f"Admin user created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("Please change the password after first login.")

if __name__ == '__main__':
    create_admin_user()
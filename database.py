import sqlite3
import os

DB_PATH = 'identity.db'

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            face_embedding TEXT,
            device_fingerprint TEXT,
            behavioral_hash TEXT,
            identity_hash_h0 TEXT,
            kyc_status TEXT DEFAULT 'pending',
            trust_score INTEGER DEFAULT 50,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            company TEXT NOT NULL,
            claim_hash TEXT,
            previous_hash TEXT,
            status TEXT DEFAULT 'pending',
            risk_level TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claim_id) REFERENCES claims(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claim_id) REFERENCES claims(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            detail TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS otp_store (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL,
            otp TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL
        )
    """)

    conn.commit()
    conn.close()

def insert_user(email, password_hash, face_embedding_json,
                device_fingerprint, behavioral_hash, identity_hash_h0):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users
        (email, password_hash, face_embedding, device_fingerprint,
         behavioral_hash, identity_hash_h0, kyc_status, trust_score)
        VALUES (?, ?, ?, ?, ?, ?, 'verified', 50)
    """, (email, password_hash, face_embedding_json,
          device_fingerprint, behavioral_hash, identity_hash_h0))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return user_id

def get_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_face_embeddings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, face_embedding FROM users WHERE face_embedding IS NOT NULL")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def insert_claim(user_id, role, company, claim_hash, previous_hash, risk_level):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO claims (user_id, role, company, claim_hash, previous_hash, risk_level, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    """, (user_id, role, company, claim_hash, previous_hash, risk_level))
    claim_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return claim_id

def get_claim_by_id(claim_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM claims WHERE id = ?", (claim_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_claims_by_user(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_latest_claim_hash(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT claim_hash FROM claims
        WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row['claim_hash'] if row else None

def update_claim_status(claim_id, status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE claims SET status = ? WHERE id = ?", (status, claim_id))
    conn.commit()
    conn.close()

def get_pending_manual_claims():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, u.email, u.trust_score
        FROM claims c
        JOIN users u ON c.user_id = u.id
        WHERE c.status = 'pending_manual'
        ORDER BY c.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_trust_score(user_id, score):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET trust_score = ? WHERE id = ?", (score, user_id))
    conn.commit()
    conn.close()

def insert_verification(claim_id, vtype, status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO verifications (claim_id, type, status)
        VALUES (?, ?, ?)
    """, (claim_id, vtype, status))
    conn.commit()
    conn.close()

def insert_document(claim_id, filename, file_hash):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (claim_id, filename, file_hash)
        VALUES (?, ?, ?)
    """, (claim_id, filename, file_hash))
    conn.commit()
    conn.close()

def get_documents_by_claim(claim_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE claim_id = ?", (claim_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def log_action(user_id, action, detail):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO audit_log (user_id, action, detail)
        VALUES (?, ?, ?)
    """, (user_id, action, detail))
    conn.commit()
    conn.close()

def save_otp(claim_id, otp, expires_at):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM otp_store WHERE claim_id = ?", (claim_id,))
    cursor.execute("""
        INSERT INTO otp_store (claim_id, otp, expires_at)
        VALUES (?, ?, ?)
    """, (claim_id, otp, expires_at))
    conn.commit()
    conn.close()

def get_otp(claim_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM otp_store
        WHERE claim_id = ?
        ORDER BY id DESC LIMIT 1
    """, (claim_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

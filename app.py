import os
import json
import random
import string
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import database
from hash_engine import (
    compute_h0, compute_claim_hash,
    verify_claim_integrity, hash_file,
    compute_behavioral_hash
)
from face_engine import (
    capture_face_embedding,
    check_liveness,
    check_duplicate_face
)
from risk_engine import (
    calculate_risk_level,
    calculate_trust_score,
    should_auto_approve
)

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def success(data):
    return jsonify({'success': True, 'data': data})

def error(message, code=400):
    return jsonify({'success': False, 'error': message}), code

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('frontend', filename)

@app.route('/api/register', methods=['POST'])
def register():
    body = request.get_json(silent=True)
    if not body:
        return error('No JSON body received')

    email = body.get('email', '').strip()
    password = body.get('password', '').strip()
    face_frames = body.get('face_frames_base64', [])
    device_fingerprint = body.get('device_fingerprint', 'unknown')
    behavioral_data = body.get('behavioral_data', {})

    if not email or not password:
        return error('Email and password are required')
    if len(password) < 6:
        return error('Password must be at least 6 characters')
    if not face_frames or len(face_frames) < 1:
        return error('At least one face frame is required')

    existing = database.get_user_by_email(email)
    if existing:
        return error('Email already registered')

    is_live = check_liveness(face_frames)
    if not is_live:
        return error('Liveness check failed. Please use a live camera, not a photo.')

    embedding = capture_face_embedding(face_frames[0])
    if embedding is None:
        return error('No face detected in image. Please try again.')

    all_stored = database.get_all_face_embeddings()
    all_embeddings = []
    for row in all_stored:
        try:
            all_embeddings.append(json.loads(row['face_embedding']))
        except Exception:
            continue

    is_duplicate = check_duplicate_face(embedding, all_embeddings)
    if is_duplicate:
        return error('A matching face already exists in the system.')

    typing_speed = behavioral_data.get('typing_speed', 0)
    mouse_events = behavioral_data.get('mouse_events', 0)
    session_duration = behavioral_data.get('session_duration', 0)
    behavioral_hash = compute_behavioral_hash(
        typing_speed, mouse_events, session_duration
    )

    h0 = compute_h0(embedding, email, device_fingerprint)
    password_hash = generate_password_hash(password)
    face_embedding_json = json.dumps(embedding)

    user_id = database.insert_user(
        email, password_hash, face_embedding_json,
        device_fingerprint, behavioral_hash, h0
    )

    database.log_action(user_id, 'registered', f'User {email} registered successfully')

    return success({
        'user_id': user_id,
        'email': email,
        'identity_hash_h0': h0[:16] + '...',
        'trust_score': 50,
        'message': 'Registration successful'
    })

@app.route('/api/login', methods=['POST'])
def login():
    body = request.get_json(silent=True)
    if not body:
        return error('No JSON body received')

    email = body.get('email', '').strip()
    password = body.get('password', '').strip()

    if not email or not password:
        return error('Email and password are required')

    user = database.get_user_by_email(email)
    if not user:
        return error('Invalid email or password')

    if not check_password_hash(user['password_hash'], password):
        return error('Invalid email or password')

    database.log_action(user['id'], 'login', f'User {email} logged in')

    return success({
        'user_id': user['id'],
        'email': user['email'],
        'trust_score': user['trust_score'],
        'kyc_status': user['kyc_status'],
        'is_admin': user['is_admin'],
        'identity_hash_h0': (user['identity_hash_h0'] or '')[:16] + '...'
    })

@app.route('/api/claim/submit', methods=['POST'])
def submit_claim():
    body = request.get_json(silent=True)
    if not body:
        return error('No JSON body received')

    user_id = body.get('user_id')
    role = body.get('role', '').strip()
    company = body.get('company', '').strip()

    if not user_id or not role or not company:
        return error('user_id, role, and company are required')

    user = database.get_user_by_id(user_id)
    if not user:
        return error('User not found')

    account_age = (
        datetime.now() -
        datetime.strptime(user['created_at'], '%Y-%m-%d %H:%M:%S')
    ).days if user.get('created_at') else 0

    risk_level = calculate_risk_level(role, company, account_age, False)

    previous_hash = database.get_latest_claim_hash(user_id)
    if not previous_hash:
        previous_hash = user['identity_hash_h0']

    timestamp = datetime.now().isoformat()
    claim_hash = compute_claim_hash(previous_hash, role, company, timestamp)

    claim_id = database.insert_claim(
        user_id, role, company,
        claim_hash, previous_hash, risk_level
    )

    trust_score = user['trust_score']
    auto = should_auto_approve(risk_level, trust_score)

    if risk_level == 'low' and auto:
        database.update_claim_status(claim_id, 'verified')
        database.insert_verification(claim_id, 'auto', 'passed')
        database.log_action(user_id, 'claim_auto_approved', f'Claim {claim_id} auto-approved')
        next_step = 'auto_approved'
        status = 'verified'

    elif risk_level == 'medium':
        database.update_claim_status(claim_id, 'pending_email')
        otp = ''.join(random.choices(string.digits, k=6))
        expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()
        database.save_otp(claim_id, otp, expires_at)
        database.log_action(user_id, 'claim_otp_sent', f'OTP sent for claim {claim_id}')
        print(f'[DEV OTP for claim {claim_id}]: {otp}')
        next_step = 'verify_email_otp'
        status = 'pending_email'

    else:
        database.update_claim_status(claim_id, 'pending_manual')
        database.log_action(user_id, 'claim_manual_review', f'Claim {claim_id} sent to manual review')
        next_step = 'manual_review'
        status = 'pending_manual'

    return success({
        'claim_id': claim_id,
        'risk_level': risk_level,
        'status': status,
        'next_step': next_step,
        'claim_hash': claim_hash[:16] + '...'
    })

@app.route('/api/claim/verify-otp', methods=['POST'])
def verify_otp():
    body = request.get_json(silent=True)
    if not body:
        return error('No JSON body received')

    claim_id = body.get('claim_id')
    otp_input = str(body.get('otp', '')).strip()

    if not claim_id or not otp_input:
        return error('claim_id and otp are required')

    stored = database.get_otp(claim_id)
    if not stored:
        return error('No OTP found for this claim')

    if datetime.now() > datetime.fromisoformat(stored['expires_at']):
        return error('OTP has expired. Please resubmit your claim.')

    if stored['otp'] != otp_input:
        return error('Incorrect OTP')

    claim = database.get_claim_by_id(claim_id)
    if not claim:
        return error('Claim not found')

    database.update_claim_status(claim_id, 'pending_manual')
    database.insert_verification(claim_id, 'email_otp', 'passed')

    user = database.get_user_by_id(claim['user_id'])
    new_score = min(user['trust_score'] + 20, 100)
    database.update_trust_score(claim['user_id'], new_score)
    database.log_action(claim['user_id'], 'otp_verified', f'OTP verified for claim {claim_id}')

    return success({
        'message': 'OTP verified. Claim moved to manual review.',
        'trust_score': new_score
    })

@app.route('/api/claim/upload-document', methods=['POST'])
def upload_document():
    claim_id = request.form.get('claim_id')
    if not claim_id:
        return error('claim_id is required')

    if 'file' not in request.files:
        return error('No file uploaded')

    f = request.files['file']
    if f.filename == '':
        return error('Empty filename')

    filename = secure_filename(f.filename)
    filepath = os.path.join(UPLOAD_FOLDER, f'{claim_id}_{filename}')
    f.save(filepath)

    file_hash = hash_file(filepath)

    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM documents WHERE file_hash = ?", (file_hash,))
    existing_doc = cursor.fetchone()
    conn.close()

    if existing_doc:
        return error('This exact document has already been uploaded before.')

    database.insert_document(int(claim_id), filename, file_hash)
    database.insert_verification(int(claim_id), 'document', 'passed')

    claim = database.get_claim_by_id(int(claim_id))
    if claim:
        user = database.get_user_by_id(claim['user_id'])
        new_score = min(user['trust_score'] + 15, 100)
        database.update_trust_score(claim['user_id'], new_score)
        database.log_action(claim['user_id'], 'document_uploaded', f'Document uploaded for claim {claim_id}')

    return success({
        'message': 'Document uploaded successfully',
        'file_hash': file_hash[:16] + '...'
    })

@app.route('/api/claim/integrity-check/<int:claim_id>', methods=['GET'])
def integrity_check(claim_id):
    claim = database.get_claim_by_id(claim_id)
    if not claim:
        return error('Claim not found')

    is_ok = verify_claim_integrity(
        claim['claim_hash'],
        claim['previous_hash'],
        claim['role'],
        claim['company'],
        claim['created_at']
    )

    if not is_ok:
        database.update_claim_status(claim_id, 'flagged')
        user = database.get_user_by_id(claim['user_id'])
        frozen_score = max(user['trust_score'] - 30, 0)
        database.update_trust_score(claim['user_id'], frozen_score)
        database.log_action(claim['user_id'], 'tamper_detected', f'Claim {claim_id} hash mismatch')

    return success({
        'claim_id': claim_id,
        'integrity_ok': is_ok,
        'status': 'clean' if is_ok else 'tampered'
    })

@app.route('/api/admin/pending-claims', methods=['GET'])
def pending_claims():
    claims = database.get_pending_manual_claims()
    result = []
    for c in claims:
        docs = database.get_documents_by_claim(c['id'])
        result.append({
            'id': c['id'],
            'user_email': c['email'],
            'role': c['role'],
            'company': c['company'],
            'risk_level': c['risk_level'],
            'trust_score': c['trust_score'],
            'status': c['status'],
            'created_at': c['created_at'],
            'documents': docs
        })
    return success({'claims': result, 'total': len(result)})

@app.route('/api/admin/review-claim', methods=['POST'])
def review_claim():
    body = request.get_json(silent=True)
    if not body:
        return error('No JSON body received')

    claim_id = body.get('claim_id')
    action = body.get('action', '').strip()
    reason = body.get('reason', '').strip()

    if not claim_id or action not in ['approve', 'reject']:
        return error('claim_id and action (approve/reject) are required')

    claim = database.get_claim_by_id(claim_id)
    if not claim:
        return error('Claim not found')

    new_status = 'verified' if action == 'approve' else 'rejected'
    database.update_claim_status(claim_id, new_status)

    if action == 'approve':
        user = database.get_user_by_id(claim['user_id'])
        new_score = min(user['trust_score'] + 20, 100)
        database.update_trust_score(claim['user_id'], new_score)

    database.log_action(
        claim['user_id'],
        f'claim_{action}d',
        f'Admin {action}d claim {claim_id}. Reason: {reason}'
    )

    return success({
        'claim_id': claim_id,
        'new_status': new_status,
        'message': f'Claim {action}d successfully'
    })

@app.route('/api/user/dashboard/<int:user_id>', methods=['GET'])
def user_dashboard(user_id):
    user = database.get_user_by_id(user_id)
    if not user:
        return error('User not found')

    claims = database.get_claims_by_user(user_id)
    claims_data = []
    for c in claims:
        docs = database.get_documents_by_claim(c['id'])
        claims_data.append({
            'id': c['id'],
            'role': c['role'],
            'company': c['company'],
            'status': c['status'],
            'risk_level': c['risk_level'],
            'claim_hash': (c['claim_hash'] or '')[:16] + '...',
            'created_at': c['created_at'],
            'documents_count': len(docs)
        })

    return success({
        'user_id': user['id'],
        'email': user['email'],
        'trust_score': user['trust_score'],
        'kyc_status': user['kyc_status'],
        'identity_hash_h0': (user['identity_hash_h0'] or '')[:16] + '...',
        'claims': claims_data,
        'total_claims': len(claims_data)
    })

if __name__ == '__main__':
    database.create_tables()
    print('Database initialized.')
    print('Server running at http://localhost:5000')
    app.run(debug=True, port=5000)

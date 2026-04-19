import hashlib
import json

def compute_h0(face_embedding_list, email, device_fingerprint):
    face_json = json.dumps(
        [round(float(x), 6) for x in face_embedding_list],
        sort_keys=True
    )
    raw = face_json + str(email) + str(device_fingerprint)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def compute_claim_hash(previous_hash, role, company, timestamp):
    raw = str(previous_hash) + str(role) + str(company) + str(timestamp)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def verify_claim_integrity(stored_hash, previous_hash, role, company, timestamp):
    recomputed = compute_claim_hash(previous_hash, role, company, timestamp)
    return recomputed == stored_hash

def hash_file(filepath):
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

def compute_behavioral_hash(typing_speed, mouse_events_count, session_duration):
    raw = str(typing_speed) + str(mouse_events_count) + str(session_duration)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

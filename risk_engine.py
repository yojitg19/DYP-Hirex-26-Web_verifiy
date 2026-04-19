HIGH_RISK_ROLES = [
    'ceo', 'founder', 'co-founder', 'director', 'president',
    'chairman', 'cto', 'coo', 'cfo', 'managing director', 'md',
    'vice president', 'vp', 'chief'
]

def calculate_risk_level(role, company, account_age_days, has_company_email):
    role_lower = str(role).lower().strip()
    for high_role in HIGH_RISK_ROLES:
        if high_role in role_lower:
            return 'high'
    if company and company.strip() and not has_company_email:
        return 'medium'
    return 'low'

def calculate_trust_score(kyc_done, email_verified, company_email_verified,
                          document_uploaded, account_age_days, no_duplicates):
    score = 0
    if kyc_done:
        score += 30
    if email_verified:
        score += 15
    if company_email_verified:
        score += 20
    if document_uploaded:
        score += 15
    if account_age_days and int(account_age_days) > 30:
        score += 10
    if no_duplicates:
        score += 10
    return min(score, 100)

def should_auto_approve(risk_level, trust_score):
    if risk_level == 'low' and trust_score >= 60:
        return True
    if risk_level == 'medium' and trust_score >= 80:
        return True
    return False

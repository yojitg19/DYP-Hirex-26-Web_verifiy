const HIGH_RISK_ROLES = [
    'ceo','founder','co-founder','director','president',
    'chairman','cto','coo','cfo','managing director',
    'md','vice president','vp','chief'
]

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('user_id')
    if (!userId) {
        window.location.href = 'index.html'
        return
    }
    document.getElementById('role-input').addEventListener('input', updateRiskBadge)
})

function updateRiskBadge() {
    const role = document.getElementById('role-input').value.toLowerCase().trim()
    const badge = document.getElementById('risk-badge')
    const isHigh = HIGH_RISK_ROLES.some(r => role.includes(r))
    const company = document.getElementById('company-input').value.trim()

    if (isHigh) {
        badge.textContent = 'High Risk — Manual Review Required'
        badge.className = 'badge badge-high'
    } else if (company) {
        badge.textContent = 'Medium Risk — Company Email OTP Required'
        badge.className = 'badge badge-medium'
    } else {
        badge.textContent = 'Low Risk — Auto Approval'
        badge.className = 'badge badge-low'
    }
    badge.style.display = 'inline-block'
}

async function submitClaim() {
    const btn = document.getElementById('claim-btn')
    const role = document.getElementById('role-input').value.trim()
    const company = document.getElementById('company-input').value.trim()
    const userId = parseInt(localStorage.getItem('user_id'))

    if (!role || !company) {
        return showAlert('error', 'Role and company are required')
    }

    btn.disabled = true
    btn.textContent = 'Submitting...'

    try {
        const res = await fetch('/api/claim/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, role, company })
        })
        const data = await res.json()

        if (!data.success) {
            showAlert('error', data.error)
            btn.disabled = false
            btn.textContent = 'Submit Claim'
            return
        }

        const d = data.data
        localStorage.setItem('current_claim_id', d.claim_id)

        document.getElementById('claim-form-section').style.display = 'none'
        document.getElementById('next-steps-section').style.display = 'block'

        const msg = document.getElementById('next-step-msg')
        const otpSection = document.getElementById('otp-section')
        const docSection = document.getElementById('doc-section')

        if (d.next_step === 'auto_approved') {
            msg.innerHTML = '<span class="badge badge-verified">Verified</span> Your claim has been auto-approved. Badge issued!'
        } else if (d.next_step === 'verify_email_otp') {
            msg.innerHTML = '<span class="badge badge-medium">OTP Required</span> An OTP has been sent to your company email. Check the Flask console for the OTP in development mode.'
            otpSection.style.display = 'block'
        } else {
            msg.innerHTML = '<span class="badge badge-pending">Under Review</span> Your claim is under manual admin review. You will be notified.'
            docSection.style.display = 'block'
        }

    } catch (e) {
        showAlert('error', 'Network error. Make sure Flask server is running.')
        btn.disabled = false
        btn.textContent = 'Submit Claim'
    }
}

async function submitOtp() {
    const btn = document.getElementById('otp-btn')
    const otp = document.getElementById('otp-input').value.trim()
    const claimId = parseInt(localStorage.getItem('current_claim_id'))

    if (!otp) return showAlert('error', 'Please enter the OTP')

    btn.disabled = true
    btn.textContent = 'Verifying...'

    try {
        const res = await fetch('/api/claim/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claim_id: claimId, otp })
        })
        const data = await res.json()

        if (!data.success) {
            showAlert('error', data.error)
            btn.disabled = false
            btn.textContent = 'Verify OTP'
            return
        }

        document.getElementById('otp-section').style.display = 'none'
        document.getElementById('doc-section').style.display = 'block'
        localStorage.setItem('trust_score', data.data.trust_score)
        showAlert('success', 'OTP verified! Please upload a supporting document.')

    } catch (e) {
        showAlert('error', 'Network error.')
        btn.disabled = false
        btn.textContent = 'Verify OTP'
    }
}

async function uploadDocument() {
    const btn = document.getElementById('doc-btn')
    const fileInput = document.getElementById('doc-input')
    const claimId = localStorage.getItem('current_claim_id')

    if (!fileInput.files.length) return showAlert('error', 'Please select a file')

    btn.disabled = true
    btn.textContent = 'Uploading...'

    const formData = new FormData()
    formData.append('claim_id', claimId)
    formData.append('file', fileInput.files[0])

    try {
        const res = await fetch('/api/claim/upload-document', {
            method: 'POST',
            body: formData
        })
        const data = await res.json()

        if (!data.success) {
            showAlert('error', data.error)
            btn.disabled = false
            btn.textContent = 'Upload Document'
            return
        }

        showAlert('success', 'Document uploaded! Your claim is now under manual review.')
        btn.disabled = true
        btn.textContent = 'Uploaded'

    } catch (e) {
        showAlert('error', 'Network error.')
        btn.disabled = false
        btn.textContent = 'Upload Document'
    }
}

function showAlert(type, msg) {
    const el = document.getElementById('alert-box')
    el.className = `alert alert-${type} show`
    el.textContent = msg
    setTimeout(() => { el.className = 'alert' }, 5000)
}

document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = localStorage.getItem('is_admin')
    if (!isAdmin || isAdmin !== '1') {
        alert('Access denied. Admin only.')
        window.location.href = 'index.html'
        return
    }
    loadPendingClaims()
})

async function loadPendingClaims() {
    try {
        const res = await fetch('/api/admin/pending-claims')
        const data = await res.json()

        if (!data.success) return

        const claims = data.data.claims
        document.getElementById('total-pending').textContent = claims.length
        document.getElementById('high-risk-count').textContent =
            claims.filter(c => c.risk_level === 'high').length

        const tbody = document.getElementById('admin-tbody')
        tbody.innerHTML = ''

        if (claims.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:24px">No pending claims</td></tr>'
            return
        }

        claims.forEach(c => {
            const tr = document.createElement('tr')
            tr.id = `row-${c.id}`
            tr.innerHTML = `
                <td>${c.user_email}</td>
                <td>${c.role}</td>
                <td>${c.company}</td>
                <td><span class="badge badge-${c.risk_level}">${c.risk_level}</span></td>
                <td>
                    <div>${c.trust_score}/100</div>
                    <div class="trust-bar-wrap" style="width:80px;margin-top:4px">
                        <div class="trust-bar-fill" style="width:${c.trust_score}%"></div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm" style="margin-bottom:4px;width:100%"
                        onclick="runIntegrityCheck(${c.id}, this)">
                        Integrity check
                    </button>
                    ${c.documents && c.documents.length > 0
                        ? `<span class="text-muted" style="font-size:12px">${c.documents.length} doc(s)</span>`
                        : '<span class="text-muted" style="font-size:12px">No docs</span>'
                    }
                </td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn btn-success btn-sm"
                            onclick="reviewClaim(${c.id}, 'approve')">
                            Approve
                        </button>
                        <button class="btn btn-danger btn-sm"
                            onclick="openRejectModal(${c.id})">
                            Reject
                        </button>
                    </div>
                </td>
            `
            tbody.appendChild(tr)
        })

    } catch (e) {
        console.error('Admin load error:', e)
    }
}

async function reviewClaim(claimId, action, reason = '') {
    try {
        const res = await fetch('/api/admin/review-claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claim_id: claimId, action, reason })
        })
        const data = await res.json()

        if (!data.success) {
            alert('Error: ' + data.error)
            return
        }

        const row = document.getElementById(`row-${claimId}`)
        if (row) row.remove()

        const totalEl = document.getElementById('total-pending')
        totalEl.textContent = Math.max(0, parseInt(totalEl.textContent) - 1)

    } catch (e) {
        alert('Network error.')
    }
}

function openRejectModal(claimId) {
    document.getElementById('reject-claim-id').value = claimId
    document.getElementById('reject-modal').classList.add('show')
}

function closeRejectModal() {
    document.getElementById('reject-modal').classList.remove('show')
    document.getElementById('reject-reason').value = ''
}

function confirmReject() {
    const claimId = parseInt(document.getElementById('reject-claim-id').value)
    const reason = document.getElementById('reject-reason').value.trim()
    if (!reason) {
        alert('Please enter a rejection reason')
        return
    }
    closeRejectModal()
    reviewClaim(claimId, 'reject', reason)
}

async function runIntegrityCheck(claimId, btn) {
    btn.disabled = true
    btn.textContent = 'Checking...'
    try {
        const res = await fetch(`/api/claim/integrity-check/${claimId}`)
        const data = await res.json()
        if (!data.success) { btn.textContent = 'Error'; return }
        if (data.data.integrity_ok) {
            btn.textContent = 'Clean'
            btn.className = 'btn btn-success btn-sm'
        } else {
            btn.textContent = 'TAMPERED'
            btn.className = 'btn btn-danger btn-sm'
            document.getElementById(`row-${claimId}`).classList.add('tampered')
        }
    } catch (e) {
        btn.textContent = 'Error'
        btn.disabled = false
    }
}

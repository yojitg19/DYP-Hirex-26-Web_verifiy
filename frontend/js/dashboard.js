document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id')
    if (!userId) {
        window.location.href = 'index.html'
        return
    }
    await loadDashboard(userId)
})

async function loadDashboard(userId) {
    try {
        const res = await fetch(`/api/user/dashboard/${userId}`)
        const data = await res.json()

        if (!data.success) {
            window.location.href = 'index.html'
            return
        }

        const d = data.data
        document.getElementById('user-email').textContent = d.email
        document.getElementById('trust-score-val').textContent = d.trust_score
        document.getElementById('trust-bar').style.width = d.trust_score + '%'
        document.getElementById('kyc-status').textContent = d.kyc_status
        document.getElementById('hash-display').textContent = d.identity_hash_h0
        document.getElementById('total-claims').textContent = d.total_claims

        const tbody = document.getElementById('claims-tbody')
        tbody.innerHTML = ''

        if (d.claims.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">No claims submitted yet</td></tr>'
            return
        }

        d.claims.forEach(c => {
            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td>${c.role}</td>
                <td>${c.company}</td>
                <td><span class="badge badge-${c.status.replace('_','-')}">${c.status.replace(/_/g,' ')}</span></td>
                <td><span class="badge badge-${c.risk_level}">${c.risk_level}</span></td>
                <td class="hash-display" style="font-size:12px">${c.claim_hash}</td>
                <td>
                    <button class="btn btn-outline btn-sm"
                        onclick="runIntegrityCheck(${c.id}, this)">
                        Check integrity
                    </button>
                </td>
            `
            tbody.appendChild(tr)
        })

    } catch (e) {
        console.error('Dashboard load error:', e)
    }
}

async function runIntegrityCheck(claimId, btn) {
    btn.disabled = true
    btn.textContent = 'Checking...'

    try {
        const res = await fetch(`/api/claim/integrity-check/${claimId}`)
        const data = await res.json()

        if (!data.success) {
            btn.textContent = 'Error'
            return
        }

        if (data.data.integrity_ok) {
            btn.textContent = 'Clean'
            btn.className = 'btn btn-success btn-sm'
        } else {
            btn.textContent = 'TAMPERED'
            btn.className = 'btn btn-danger btn-sm'
            btn.closest('tr').classList.add('tampered')
        }

    } catch (e) {
        btn.textContent = 'Error'
        btn.disabled = false
    }
}

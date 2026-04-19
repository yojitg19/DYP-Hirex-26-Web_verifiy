let currentStep = 1
let capturedFrames = []
let webcamStream = null

document.addEventListener('DOMContentLoaded', () => {
    collectBehavioralData('password')
    showStep(1)
})

function showStep(n) {
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'))
    document.querySelectorAll('.step-dot').forEach((d, i) => {
        d.classList.remove('active', 'done')
        if (i + 1 < n) d.classList.add('done')
        if (i + 1 === n) d.classList.add('active')
    })
    document.getElementById('step-' + n).classList.add('active')
    currentStep = n
}

function goNext() {
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value.trim()
    const confirm = document.getElementById('confirm-password').value.trim()

    if (!email || !password || !confirm) {
        return showAlert('error', 'All fields are required')
    }
    if (!email.includes('@')) {
        return showAlert('error', 'Enter a valid email address')
    }
    if (password.length < 6) {
        return showAlert('error', 'Password must be at least 6 characters')
    }
    if (password !== confirm) {
        return showAlert('error', 'Passwords do not match')
    }
    clearAlert()
    showStep(2)
    startWebcam()
}

async function startWebcam() {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true })
        document.getElementById('webcam-video').srcObject = webcamStream
        document.getElementById('webcam-status').textContent = 'Camera ready. Click capture when ready.'
    } catch (e) {
        showAlert('error', 'Camera access denied. Please allow camera access and refresh.')
    }
}

async function captureFrames() {
    const video = document.getElementById('webcam-video')
    const btn = document.getElementById('capture-btn')
    const status = document.getElementById('webcam-status')

    btn.disabled = true
    capturedFrames = []
    status.textContent = 'Capturing frame 1 of 3...'

    for (let i = 0; i < 3; i++) {
        status.textContent = `Capturing frame ${i + 1} of 3... please slowly turn your head left/right or nod`
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 240
        canvas.getContext('2d').drawImage(video, 0, 0)
        capturedFrames.push(canvas.toDataURL('image/jpeg', 0.8))
        await new Promise(r => setTimeout(r, 1000))
    }

    if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop())
    }

    status.textContent = '3 frames captured. Proceeding...'
    document.getElementById('review-email').textContent = document.getElementById('email').value
    setTimeout(() => showStep(3), 800)
}

async function submitRegistration() {
    const btn = document.getElementById('register-btn')
    btn.disabled = true
    btn.textContent = 'Registering...'

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value.trim()
    const deviceFingerprint = getDeviceFingerprint()
    const behavioralData = window.getBehavioralData ? window.getBehavioralData() : {}

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                face_frames_base64: capturedFrames,
                device_fingerprint: deviceFingerprint,
                behavioral_data: behavioralData
            })
        })
        const data = await res.json()

        if (!data.success) {
            showAlert('error', data.error)
            btn.disabled = false
            btn.textContent = 'Complete Registration'
            return
        }

        localStorage.setItem('user_id', data.data.user_id)
        localStorage.setItem('email', data.data.email)
        localStorage.setItem('trust_score', data.data.trust_score)

        document.getElementById('result-hash').textContent = data.data.identity_hash_h0
        document.getElementById('result-score').textContent = data.data.trust_score
        showStep(4)

    } catch (e) {
        showAlert('error', 'Network error. Make sure the Flask server is running.')
        btn.disabled = false
        btn.textContent = 'Complete Registration'
    }
}

function showAlert(type, msg) {
    const el = document.getElementById('alert-box')
    el.className = `alert alert-${type} show`
    el.textContent = msg
}

function clearAlert() {
    const el = document.getElementById('alert-box')
    el.className = 'alert'
    el.textContent = ''
}

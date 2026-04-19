function getDeviceFingerprint() {
    const parts = [
        screen.width,
        screen.height,
        screen.colorDepth,
        navigator.platform,
        navigator.language,
        navigator.hardwareConcurrency || 0,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.userAgent.slice(0, 80)
    ]
    return parts.join('|')
}

function collectBehavioralData(targetInputId) {
    const data = {
        typing_speed: 0,
        mouse_events: 0,
        session_duration: 0
    }
    const start = Date.now()
    let keyTimes = []
    let mouseCount = 0

    const input = document.getElementById(targetInputId)
    if (input) {
        input.addEventListener('keydown', () => {
            keyTimes.push(Date.now())
        })
    }

    document.addEventListener('mousemove', () => {
        mouseCount++
    })

    window.getBehavioralData = function() {
        data.session_duration = Math.round((Date.now() - start) / 1000)
        data.mouse_events = mouseCount
        if (keyTimes.length > 1) {
            const intervals = []
            for (let i = 1; i < keyTimes.length; i++) {
                intervals.push(keyTimes[i] - keyTimes[i - 1])
            }
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
            data.typing_speed = Math.round(avg)
        }
        return data
    }
}

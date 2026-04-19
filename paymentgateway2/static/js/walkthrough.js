const urlParams = new URLSearchParams(window.location.search);
const scenario = urlParams.get('scenario') || 'happy-path';

const scenarios = {
  'happy-path': {
    title: 'Happy Path: Successful Event',
    description: 'Event is successful with high attendance, great ratings, and no complaints. Payout is released.',
    steps: [
      {
        title: 'Step 1: Attendees Register & Pay',
        description: 'Attendees sign up and pay ₹5,000 each. Payments are captured and held in escrow on the platform, not sent to the organizer yet.',
        action: 'Enter attendee names to simulate registrations.',
        action_type: 'register',
        result: 'Each registration adds ₹5,000 to escrow.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Open' }
      },
      {
        title: 'Step 2: 48-Hour Reminder Sent',
        description: '48 hours before the event, the organizer receives an automated reminder. This is a checkpoint—if cancelled here, attendees get a full refund.',
        action: 'The system sends a warning to the organizer.',
        action_type: 'info',
        result: 'Organizer is notified. Event is not cancelled.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Reminder Sent' }
      },
      {
        title: 'Step 3: Event Day Check-In',
        description: 'Attendees arrive at the venue and scan a QR code to check in. This tracks actual attendance.',
        action: 'Simulate attendees checking in.',
        action_type: 'checkin',
        result: 'High check-in rate indicates a successful turnout. Attendance is confirmed.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 92, rating: 0, complaints: 0, status: 'Event Happening' }
      },
      {
        title: 'Step 4: Post-Event Feedback (48–72h window)',
        description: 'Attendees submit ratings and complaints. In this scenario, most attendees are satisfied (rating ≥ 3.5) and few have complaints.',
        action: 'Attendees submit positive feedback.',
        action_type: 'feedback',
        result: 'Average rating is 4.2. Complaint rate is 4% (well below the 10% threshold).',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 92, rating: 4.2, complaints: 2, status: 'Feedback Collected' }
      },
      {
        title: 'Step 5: Payout Released',
        description: 'The system evaluates: rating ≥ 3.5? Yes. Complaints ≤ 10%? Yes. Escrow is released! The organizer receives ₹237,500 (₹250,000 minus 5% platform fee of ₹12,500).',
        action: 'Admin clicks to process payout decision.',
        action_type: 'payout',
        result: '✓ Full payout released. ₹237,500 sent to organizer. ₹12,500 platform fee retained.',
        metrics_after: { attendees: 50, escrow: 0, checkin_rate: 92, rating: 4.2, complaints: 2, status: 'Payout Released' }
      }
    ]
  },
  'cancellation': {
    title: 'Event Cancelled: Full Refund',
    description: 'Organizer cancels the event within 48 hours of the start time. All attendees receive a full refund.',
    steps: [
      {
        title: 'Step 1: Attendees Register & Pay',
        description: 'Attendees sign up and pay ₹5,000 each. Funds are held in escrow.',
        action: 'Simulate attendee registrations.',
        action_type: 'register',
        result: 'Escrow now holds ₹250,000 (50 attendees × ₹5,000).',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Open' }
      },
      {
        title: 'Step 2: 48-Hour Window Active',
        description: 'The critical 48-hour window before the event is active. If the organizer cancels during this time, a full refund is automatic.',
        action: 'Waiting for decision.',
        action_type: 'info',
        result: 'Event is still scheduled. No action taken.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Reminder Sent' }
      },
      {
        title: 'Step 3: Event Cancelled',
        description: 'The organizer cancels the event. This could be due to low registrations, venue issues, or other reasons.',
        action: 'Admin or organizer clicks to cancel the event.',
        action_type: 'cancel',
        result: 'Event status changes to "Cancelled". Escrow is immediately frozen for refunding.',
        metrics_after: { attendees: 50, escrow: 0, checkin_rate: 0, rating: 0, complaints: 0, status: 'Cancelled' }
      },
      {
        title: 'Step 4: Full Refund Issued',
        description: 'All escrow funds are released back to attendees. Each attendee receives a full ₹5,000 refund. No platform fee is deducted.',
        action: 'Refunds are processed automatically.',
        action_type: 'info',
        result: 'All 50 attendees receive ₹5,000 each. Total refunded: ₹250,000.',
        metrics_after: { attendees: 50, escrow: 0, checkin_rate: 0, rating: 0, complaints: 0, status: 'Refunded' }
      },
      {
        title: 'Step 5: Event Closed',
        description: 'The event is now closed. All funds have been refunded. Attendees are protected from cancellation losses.',
        action: 'Final state reached.',
        action_type: 'info',
        result: '✓ All attendees refunded. Event marked as completed. No platform fee charged.',
        metrics_after: { attendees: 50, escrow: 0, checkin_rate: 0, rating: 0, complaints: 0, status: 'Refunded' }
      }
    ]
  },
  'frozen': {
    title: 'Escrow Frozen: Too Many Complaints',
    description: 'Event happens but too many attendees file complaints (>10%). Escrow is frozen pending admin investigation.',
    steps: [
      {
        title: 'Step 1: Attendees Register & Pay',
        description: 'Attendees pay ₹5,000 each. Funds held in escrow.',
        action: 'Simulate attendee registrations.',
        action_type: 'register',
        result: 'Escrow: ₹250,000 (50 attendees).',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Open' }
      },
      {
        title: 'Step 2: Event Reminder Sent',
        description: 'Event reminder sent to organizer. Event proceeds as planned.',
        action: 'System sends reminder.',
        action_type: 'info',
        result: 'No cancellation. Event goes ahead.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Reminder Sent' }
      },
      {
        title: 'Step 3: Event Day Check-In',
        description: 'Attendees check in. Let\'s assume a decent turnout (80%).',
        action: 'Attendees check in at the venue.',
        action_type: 'checkin',
        result: 'Check-in rate: 80%. But content quality issues detected.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 80, rating: 0, complaints: 0, status: 'Event Happening' }
      },
      {
        title: 'Step 4: Post-Event Feedback - Many Complaints',
        description: 'Attendees submit feedback. Unfortunately, many are unhappy (poor speaker quality, misleading content, venue issues). Complaint rate exceeds 10%.',
        action: 'Attendees file complaints.',
        action_type: 'feedback',
        result: 'Average rating: 2.1 (below 3.5 threshold). Complaint rate: 16% (above 10% threshold).',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 80, rating: 2.1, complaints: 8, status: 'Feedback Collected' }
      },
      {
        title: 'Step 5: Escrow Frozen - Admin Investigation',
        description: 'Since complaints exceed 10%, the escrow is frozen automatically. No payout is released. An admin must investigate the complaints and make a final decision.',
        action: 'System locks escrow.',
        action_type: 'freeze',
        result: '⚠ Escrow FROZEN. ₹250,000 locked. Admin investigation required.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 80, rating: 2.1, complaints: 8, status: 'Under Investigation' }
      }
    ]
  },
  'low-attendance': {
    title: 'Low Attendance: Escrow Held',
    description: 'Event happens but attendance is poor (<10% check-in rate). Escrow is held until review completes.',
    steps: [
      {
        title: 'Step 1: Attendees Register & Pay',
        description: 'Attendees register and pay. Funds in escrow.',
        action: 'Simulate attendee registrations.',
        action_type: 'register',
        result: 'Escrow: ₹250,000 (50 attendees).',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Open' }
      },
      {
        title: 'Step 2: 48-Hour Reminder',
        description: 'Reminder sent to organizer. Event proceeds.',
        action: 'System sends reminder.',
        action_type: 'info',
        result: 'Event not cancelled. Going ahead.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 0, rating: 0, complaints: 0, status: 'Reminder Sent' }
      },
      {
        title: 'Step 3: Event Day - Poor Attendance',
        description: 'Event happens but very few attendees show up. Only 3 out of 50 registered attendees check in (6% check-in rate).',
        action: 'Attendees check in at the venue.',
        action_type: 'checkin',
        result: 'Check-in rate: 6%. Extremely low attendance detected!',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 6, rating: 0, complaints: 0, status: 'Event Happening' }
      },
      {
        title: 'Step 4: Feedback from Those Present',
        description: 'Only the 3 attendees who showed up submit feedback. They rate the event highly (4.0), and no complaints.',
        action: 'Attendees submit feedback.',
        action_type: 'feedback',
        result: 'Rating: 4.0 (good). Complaints: 0. But attendance was poor.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 6, rating: 4.0, complaints: 0, status: 'Feedback Collected' }
      },
      {
        title: 'Step 5: Escrow Held - Extended Review',
        description: 'The system detects: ratings are good, but check-in rate is critically low (<10%). This is suspicious. Escrow remains held until admin reviews what happened. Did the organizer properly market the event? Did attendees lose faith?',
        action: 'System evaluates the outcome.',
        action_type: 'hold',
        result: '⏸ Escrow HELD. Low attendance is a red flag. Admin review required before payout.',
        metrics_after: { attendees: 50, escrow: 250000, checkin_rate: 6, rating: 4.0, complaints: 0, status: 'Under Review' }
      }
    ]
  }
};

const currentScenario = scenarios[scenario];
let currentStep = 0;

function updateProgress() {
  const totalSteps = currentScenario.steps.length;
  const percent = ((currentStep + 1) / totalSteps) * 100;
  document.getElementById('progress-fill').style.width = percent + '%';
  document.getElementById('progress-text').textContent = `Step ${currentStep + 1} of ${totalSteps}`;
}

function renderStep() {
  const step = currentScenario.steps[currentStep];
  const container = document.getElementById('step-container');
  
  let html = `
    <div class="step">
      <h2 class="step-title">${step.title}</h2>
      <p class="step-desc">${step.description}</p>
  `;

  if (step.action_type === 'register') {
    html += `
      <div class="step-action">
        <h4>📝 Simulate Registrations</h4>
        <div class="step-action-form">
          <input type="number" id="reg-count" placeholder="How many attendees? (e.g., 50)" min="1" value="50" />
          <button onclick="simulateRegistrations()">Register Attendees</button>
        </div>
      </div>
      <div id="reg-result" class="step-result" style="display:none;"></div>
    `;
  } else if (step.action_type === 'checkin') {
    html += `
      <div class="step-action">
        <h4>📍 Simulate Check-ins</h4>
        <div class="step-action-form">
          <input type="number" id="checkin-pct" placeholder="What % check in? (e.g., 80)" min="0" max="100" value="${step.metrics_after.checkin_rate || 80}" />
          <button onclick="simulateCheckIn()">Process Check-ins</button>
        </div>
      </div>
      <div id="checkin-result" class="step-result" style="display:none;"></div>
    `;
  } else if (step.action_type === 'feedback') {
    html += `
      <div class="step-action">
        <h4>⭐ Simulate Feedback</h4>
        <div class="step-action-form">
          <label>
            Average Rating:
            <input type="number" id="rating-val" placeholder="Rating (0-5)" min="0" max="5" step="0.1" value="${step.metrics_after.rating || 4.2}" />
          </label>
          <label>
            Complaint Count:
            <input type="number" id="complaint-val" placeholder="Number of complaints" min="0" value="${step.metrics_after.complaints || 2}" />
          </label>
          <button onclick="simulateFeedback()">Submit Feedback</button>
        </div>
      </div>
      <div id="feedback-result" class="step-result" style="display:none;"></div>
    `;
  } else if (step.action_type === 'cancel') {
    html += `
      <div class="step-action">
        <h4>✗ Cancel Event</h4>
        <p>Click to cancel the event and trigger refunds.</p>
        <button onclick="cancelEvent()">Cancel Event</button>
      </div>
      <div id="cancel-result" class="step-result" style="display:none;"></div>
    `;
  } else if (step.action_type === 'freeze') {
    html += `
      <div class="step-action">
        <h4>❄ Escrow Frozen</h4>
        <p>Complaints exceed 10%. Escrow automatically locked. Click to see details.</p>
        <button onclick="showFrozenDetails()">View Details</button>
      </div>
      <div id="freeze-result" class="step-result" style="display:none;"></div>
    `;
  } else if (step.action_type === 'hold') {
    html += `
      <div class="step-action">
        <h4>⏸ Escrow On Hold</h4>
        <p>Low attendance detected. Escrow held for admin review.</p>
        <button onclick="showHoldDetails()">View Details</button>
      </div>
      <div id="hold-result" class="step-result" style="display:none;"></div>
    `;
  } else if (step.action_type === 'payout') {
    html += `
      <div class="step-action">
        <h4>💰 Process Payout</h4>
        <p>Ratings are good, complaints are low. Escrow is released!</p>
        <button onclick="processPayout()">Release Payout</button>
      </div>
      <div id="payout-result" class="step-result" style="display:none;"></div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
  updateProgress();
  updateMetrics(step.metrics_after);
}

function updateMetrics(data) {
  document.getElementById('attendees').textContent = data.attendees;
  document.getElementById('escrow').textContent = `₹${(data.escrow || 0).toLocaleString()}`;
  document.getElementById('checkin-rate').textContent = data.checkin_rate + '%';
  document.getElementById('rating').textContent = data.rating > 0 ? data.rating.toFixed(1) : '—';
  document.getElementById('complaints').textContent = data.complaints;
  document.getElementById('status').textContent = data.status;
}

function nextStep() {
  if (currentStep < currentScenario.steps.length - 1) {
    currentStep++;
    renderStep();
  }
  updateButtonStates();
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
  updateButtonStates();
}

function updateButtonStates() {
  document.getElementById('prev-btn').disabled = currentStep === 0;
  document.getElementById('next-btn').disabled = currentStep === currentScenario.steps.length - 1;
}

window.simulateRegistrations = function() {
  const count = parseInt(document.getElementById('reg-count').value) || 50;
  const escrow = count * 5000;
  const result = document.getElementById('reg-result');
  result.innerHTML = `✓ ${count} attendees registered. Escrow: ₹${escrow.toLocaleString()}`;
  result.classList.add('success');
  result.style.display = 'block';
};

window.simulateCheckIn = function() {
  const pct = parseInt(document.getElementById('checkin-pct').value) || 80;
  const result = document.getElementById('checkin-result');
  result.innerHTML = `✓ Check-in rate: ${pct}%. Attendance verified.`;
  result.classList.add('success');
  result.style.display = 'block';
};

window.simulateFeedback = function() {
  const rating = parseFloat(document.getElementById('rating-val').value) || 4.2;
  const complaints = parseInt(document.getElementById('complaint-val').value) || 2;
  const result = document.getElementById('feedback-result');
  const complaintRate = Math.round((complaints / 50) * 100);
  result.innerHTML = `✓ Average rating: ${rating}. Complaints: ${complaints} (${complaintRate}% of attendees).`;
  result.classList.add('success');
  result.style.display = 'block';
};

window.cancelEvent = function() {
  const result = document.getElementById('cancel-result');
  result.innerHTML = `✓ Event cancelled. All ₹250,000 in escrow will be refunded to attendees.`;
  result.classList.add('success');
  result.style.display = 'block';
};

window.showFrozenDetails = function() {
  const result = document.getElementById('freeze-result');
  result.innerHTML = `<strong>Escrow Frozen</strong><br/>Complaints: 8 of 50 (16% > 10% threshold)<br/>Action: Admin review required. Organizer may be penalized.`;
  result.classList.add('error');
  result.style.display = 'block';
};

window.showHoldDetails = function() {
  const result = document.getElementById('hold-result');
  result.innerHTML = `<strong>Escrow On Hold</strong><br/>Check-in rate: 6% (< 10% threshold)<br/>Reason: Low attendance is suspicious.<br/>Next: Admin investigates and makes final payout decision.`;
  result.classList.add('error');
  result.style.display = 'block';
};

window.processPayout = function() {
  const result = document.getElementById('payout-result');
  const payout = 250000 * 0.95;
  const fee = 250000 * 0.05;
  result.innerHTML = `✓ <strong>Payout Released!</strong><br/>Organizer receives: ₹${payout.toLocaleString()}<br/>Platform fee: ₹${fee.toLocaleString()}`;
  result.classList.add('success');
  result.style.display = 'block';
};

document.getElementById('scenario-title').textContent = currentScenario.title;
document.getElementById('scenario-desc').textContent = currentScenario.description;
document.getElementById('prev-btn').addEventListener('click', prevStep);
document.getElementById('next-btn').addEventListener('click', nextStep);

renderStep();
updateButtonStates();

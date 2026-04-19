const registerForm = document.getElementById('register-form');
const checkinForm = document.getElementById('checkin-form');
const feedbackForm = document.getElementById('feedback-form');
const registerMessage = document.getElementById('register-message');
const checkinMessage = document.getElementById('checkin-message');
const feedbackMessage = document.getElementById('feedback-message');
const adminResult = document.getElementById('admin-result');
const paymentHistory = document.getElementById('payment-history');
const processPayoutButton = document.getElementById('process-payout');
const cancelEventButton = document.getElementById('cancel-event');

function showMessage(element, text, type = 'info') {
  element.textContent = text;
  element.style.backgroundColor = type === 'error' ? '#fee2e2' : '#eef2ff';
  element.style.color = type === 'error' ? '#991b1b' : '#3730a3';
}

async function updatePaymentHistory() {
  const response = await fetch('/api/status');
  const payload = await response.json();
  if (!payload.success) return;
  const history = payload.state.payment_history;
  if (!history.length) {
    paymentHistory.innerHTML = '<p>No payments recorded yet.</p>';
    return;
  }
  paymentHistory.innerHTML = history
    .map(item => `<div class="message"><strong>${item.attendee}</strong> paid ₹${item.amount} at ${new Date(item.timestamp).toLocaleString()} (ID: ${item.paymentId})</div>`)
    .join('');
}

async function postJson(path, data, messageElement) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (payload.success) {
    showMessage(messageElement, payload.message || 'Success.');
    updatePaymentHistory();
  } else {
    showMessage(messageElement, payload.message || 'Error occurred.', 'error');
  }
  return payload;
}

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  await postJson('/api/register', { name, email }, registerMessage);
});

checkinForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('checkin-email').value.trim();
  await postJson('/api/checkin', { email }, checkinMessage);
});

feedbackForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('feedback-email').value.trim();
  const rating = document.getElementById('feedback-rating').value;
  const comment = document.getElementById('feedback-comment').value.trim();
  await postJson('/api/feedback', { email, rating, comment }, feedbackMessage);
});

processPayoutButton?.addEventListener('click', async () => {
  const payload = await postJson('/api/payout', {}, adminResult);
  if (payload?.result) {
    showMessage(adminResult, payload.result.reason || 'Payout processed successfully.');
  }
});

cancelEventButton?.addEventListener('click', async () => {
  const payload = await postJson('/api/cancel', {}, adminResult);
  if (payload.success) {
    showMessage(adminResult, payload.message);
  }
});

updatePaymentHistory();

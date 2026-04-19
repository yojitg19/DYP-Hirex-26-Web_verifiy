const adminResult = document.getElementById('admin-result');
const paymentHistory = document.getElementById('payment-history');
const sendReminderButton = document.getElementById('send-reminder');
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
    .map(item => `<div class="message"><strong>${item.attendee}</strong> paid ₹${item.amount} at ${new Date(item.timestamp).toLocaleString()}</div>`)
    .join('');
}

async function postJson(path, data) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

sendReminderButton?.addEventListener('click', () => {
  showMessage(adminResult, '48h warning reminder sent to organizer.', 'info');
});

processPayoutButton?.addEventListener('click', async () => {
  const payload = await postJson('/api/payout', {});
  if (payload.success) {
    showMessage(adminResult, payload.result.reason || 'Payout processed.');
    updatePaymentHistory();
  } else {
    showMessage(adminResult, payload.message || 'Error processing payout.', 'error');
  }
});

cancelEventButton?.addEventListener('click', async () => {
  const payload = await postJson('/api/cancel', {});
  if (payload.success) {
    showMessage(adminResult, payload.message);
  } else {
    showMessage(adminResult, payload.message || 'Error cancelling event.', 'error');
  }
});

updatePaymentHistory();

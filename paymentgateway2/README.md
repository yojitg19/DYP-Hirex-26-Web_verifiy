# Escrow & Payout Demo

A demo application for the event escrow and payout flow using Python Flask, HTML, CSS, and JavaScript.

## Features
- Simulate attendee registration and payment capture
- Hold funds in escrow until event completion
- Check-in tracking with attendance rate
- Submit ratings and complaints
- Admin processing of payout decisions
- Cancel event and issue full refunds

## Run locally
1. Create a virtual environment and install dependencies:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Start the Flask app:

```powershell
python app.py
```

3. Open `http://127.0.0.1:5000` in your browser.

## Notes
- The payment gateway is simulated.
- Escrow amounts are held in memory for the demo.
- The `admin` page can process payout decisions based on the rating and complaint logic.

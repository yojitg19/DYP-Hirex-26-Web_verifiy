from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request, redirect, url_for
from uuid import uuid4

app = Flask(__name__)

platform_fee_pct = 0.05

# Demo event data for the escrow/payout flow
event = {
    "id": "event-1",
    "name": "National Startup Summit 2026",
    "date": datetime.utcnow() + timedelta(days=1, hours=2),
    "venue": "Bengaluru Convention Center",
    "ticket_price": 5000,
    "capacity": 200,
    "attendees": [],
    "checkins": [],
    "ratings": [],
    "complaints": [],
    "status": "open",
    "escrow_amount": 0,
    "payout_status": "held",
    "cancelled": False,
    "refunds_issued": False,
    "reminder_sent": False,
    "payment_history": [],
}


def current_state():
    attendees = len(event["attendees"])
    checkins = len(event["checkins"])
    completed_rating = [r["rating"] for r in event["ratings"]]
    rating_avg = round(sum(completed_rating) / len(completed_rating), 2) if completed_rating else 0
    complaint_count = len(event["complaints"])
    complaint_rate = round((complaint_count / attendees) * 100, 2) if attendees else 0
    checkin_rate = round((checkins / attendees) * 100, 2) if attendees else 0
    now = datetime.utcnow()
    hours_until_event = max(round((event["date"] - now).total_seconds() / 3600, 2), 0)
    return {
        "attendees": attendees,
        "checkins": checkins,
        "rating_avg": rating_avg,
        "complaints": complaint_count,
        "complaint_rate": complaint_rate,
        "checkin_rate": checkin_rate,
        "hours_until_event": hours_until_event,
        "escrow_amount": event["escrow_amount"],
        "payout_status": event["payout_status"],
        "status": event["status"],
        "cancelled": event["cancelled"],
        "reminder_sent": event["reminder_sent"],
        "payment_history": event["payment_history"],
    }


def process_payout_decision():
    if event["cancelled"]:
        return {
            "decision": "refund",
            "reason": "Event cancelled. Full refund to attendees.",
            "escrow_after": 0,
            "fee": 0,
        }

    state = current_state()
    if state["attendees"] == 0:
        return {
            "decision": "no_funds",
            "reason": "No attendees have paid yet.",
            "escrow_after": event["escrow_amount"],
            "fee": 0,
        }

    if state["complaint_rate"] > 10:
        return {
            "decision": "frozen",
            "reason": "Complaints exceed 10% of attendees. Escrow frozen pending investigation.",
            "escrow_after": event["escrow_amount"],
            "fee": 0,
        }

    if state["rating_avg"] >= 3.5 and state["complaint_rate"] <= 10:
        fee = round(event["escrow_amount"] * platform_fee_pct, 2)
        payout = round(event["escrow_amount"] - fee, 2)
        return {
            "decision": "release",
            "reason": "Event completed satisfactorily. Full payout released minus platform fee.",
            "escrow_after": 0,
            "fee": fee,
            "payout": payout,
        }

    return {
        "decision": "hold",
        "reason": "Event has insufficient ratings or pending feedback. Escrow held until review completes.",
        "escrow_after": event["escrow_amount"],
            "fee": 0,
    }


@app.route("/")
def index():
    return render_template("landing.html")


@app.route("/index")
def sandbox():
    return render_template("index.html", event=event, state=current_state())


@app.route("/admin")
def admin():
    return render_template("admin.html", event=event, state=current_state())


@app.route("/event")
def event_page():
    return render_template("event.html", event=event, state=current_state())


@app.route("/demo")
def demo():
    return render_template("demo.html")


@app.route("/walkthrough")
def walkthrough():
    return render_template("walkthrough.html")


@app.route("/api/register", methods=["POST"])
def register():
    data = request.json or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    if not name or not email:
        return jsonify({"success": False, "message": "Name and email are required."}), 400
    if event["status"] != "open":
        return jsonify({"success": False, "message": "Registrations are closed."}), 400
    if any(att["email"] == email for att in event["attendees"]):
        return jsonify({"success": False, "message": "This attendee has already registered."}), 400

    attendee = {
        "id": str(uuid4()),
        "name": name,
        "email": email,
        "registered_at": datetime.utcnow().isoformat() + "Z",
    }
    event["attendees"].append(attendee)
    event["escrow_amount"] += event["ticket_price"]
    event["payment_history"].append({
        "attendee": name,
        "email": email,
        "amount": event["ticket_price"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "paymentId": f"pay_{uuid4().hex[:10]}",
    })

    return jsonify({"success": True, "message": "Registration successful. Payment held in escrow.", "state": current_state()})


@app.route("/api/cancel", methods=["POST"])
def cancel_event():
    if event["cancelled"]:
        return jsonify({"success": False, "message": "Event is already cancelled."}), 400
    event["cancelled"] = True
    event["status"] = "cancelled"
    event["payout_status"] = "refunded"
    event["escrow_amount"] = 0
    event["refunds_issued"] = True
    return jsonify({"success": True, "message": "Event cancelled. Full refunds issued.", "state": current_state()})


@app.route("/api/checkin", methods=["POST"])
def checkin():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    if event["cancelled"]:
        return jsonify({"success": False, "message": "Event is cancelled; check-in not allowed."}), 400
    attendee = next((att for att in event["attendees"] if att["email"] == email), None)
    if not attendee:
        return jsonify({"success": False, "message": "Attendee not found."}), 404
    if email in event["checkins"]:
        return jsonify({"success": False, "message": "Attendee already checked in."}), 400
    event["checkins"].append(email)
    return jsonify({"success": True, "message": "Check-in recorded.", "state": current_state()})


@app.route("/api/feedback", methods=["POST"])
def feedback():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    rating = data.get("rating")
    comment = data.get("comment", "").strip()
    if event["cancelled"]:
        return jsonify({"success": False, "message": "Event is cancelled; feedback is not accepted."}), 400
    attendee = next((att for att in event["attendees"] if att["email"] == email), None)
    if not attendee:
        return jsonify({"success": False, "message": "Attendee not found."}), 404
    try:
        rating_value = float(rating)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Rating must be a number."}), 400
    if rating_value < 0 or rating_value > 5:
        return jsonify({"success": False, "message": "Rating must be between 0 and 5."}), 400
    event["ratings"].append({
        "attendee": email,
        "rating": rating_value,
        "comment": comment,
        "submitted_at": datetime.utcnow().isoformat() + "Z",
    })
    if comment:
        event["complaints"].append({
            "reporter": email,
            "description": comment,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })
    return jsonify({"success": True, "message": "Feedback submitted.", "state": current_state()})


@app.route("/api/payout", methods=["POST"])
def payout():
    result = process_payout_decision()
    if result["decision"] == "release":
        event["payout_status"] = "fully_released"
        event["escrow_amount"] = 0
        event["status"] = "completed"
    elif result["decision"] == "refund":
        event["payout_status"] = "refunded"
        event["status"] = "cancelled"
    elif result["decision"] == "frozen":
        event["payout_status"] = "frozen"
        event["status"] = "under_review"
    else:
        event["payout_status"] = "held"
    return jsonify({"success": True, "result": result, "state": current_state()})


@app.route("/api/status")
def status():
    return jsonify({"success": True, "event": event, "state": current_state()})


if __name__ == "__main__":
    app.run(debug=True)

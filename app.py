from flask import Flask, render_template, request, jsonify
import os
import requests

app = Flask(__name__)

# --------------------------------------------------------------------
# Put your API key here (or set it as an environment variable instead:
#   export ANTHROPIC_API_KEY="sk-ant-..."
# Get a key from https://console.anthropic.com/
# --------------------------------------------------------------------
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-6"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"reply": "Say something and I'll respond!"})

    if not ANTHROPIC_API_KEY:
        return jsonify({
            "reply": "(Demo mode) No API key is set yet. Add your "
                     "ANTHROPIC_API_KEY to app.py or as an environment "
                     "variable to get real AI replies. You said: "
                     f"'{user_message}'"
        })

    try:
        response = requests.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": 500,
                "messages": [{"role": "user", "content": user_message}],
            },
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()
        reply_text = "".join(
            block.get("text", "")
            for block in result.get("content", [])
            if block.get("type") == "text"
        )
        return jsonify({"reply": reply_text or "(no reply text returned)"})

    except requests.exceptions.RequestException as e:
        return jsonify({"reply": f"Error reaching AI service: {e}"}), 500


# --------------------------------------------------------------------
# Feature 1: Revenue / profit forecast (simple compound growth model)
# --------------------------------------------------------------------
@app.route("/api/forecast", methods=["POST"])
def forecast():
    data = request.get_json(force=True) or {}
    try:
        starting_value = float(data.get("startingValue", 1000))
        growth_rate_pct = float(data.get("growthRate", 5))   # % per period
        periods = int(data.get("periods", 12))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid input numbers"}), 400

    periods = max(1, min(periods, 120))  # sane cap
    growth_rate = growth_rate_pct / 100.0

    values = []
    current = starting_value
    for i in range(1, periods + 1):
        current = current * (1 + growth_rate)
        values.append(round(current, 2))

    return jsonify({
        "startingValue": starting_value,
        "growthRatePct": growth_rate_pct,
        "periods": periods,
        "forecast": values,
    })


# --------------------------------------------------------------------
# Feature 2: Cost estimator by region (static multiplier table —
# adjust these numbers to whatever's realistic for your use case)
# --------------------------------------------------------------------
REGION_MULTIPLIERS = {
    "North America": 1.30,
    "Western Europe": 1.25,
    "Eastern Europe": 0.85,
    "South Asia": 0.55,
    "Southeast Asia": 0.65,
    "East Asia": 1.10,
    "Middle East": 1.00,
    "Africa": 0.60,
    "South America": 0.75,
    "Oceania": 1.35,
}


@app.route("/api/regions", methods=["GET"])
def regions():
    return jsonify({"regions": list(REGION_MULTIPLIERS.keys())})


@app.route("/api/cost-estimate", methods=["POST"])
def cost_estimate():
    data = request.get_json(force=True) or {}
    try:
        base_cost = float(data.get("baseCost", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid base cost"}), 400

    region = data.get("region", "")
    multiplier = REGION_MULTIPLIERS.get(region)
    if multiplier is None:
        return jsonify({"error": "Unknown region"}), 400

    estimated = round(base_cost * multiplier, 2)
    return jsonify({
        "region": region,
        "multiplier": multiplier,
        "baseCost": base_cost,
        "estimatedCost": estimated,
    })


# --------------------------------------------------------------------
# Feature 3: Currency converter — uses the free Frankfurter API
# (no key required). Falls back to an error message if unreachable.
# --------------------------------------------------------------------
@app.route("/api/convert", methods=["POST"])
def convert():
    data = request.get_json(force=True) or {}
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    from_currency = data.get("from", "USD").upper()
    to_currency = data.get("to", "EUR").upper()

    try:
        resp = requests.get(
            "https://api.frankfurter.app/latest",
            params={"amount": amount, "from": from_currency, "to": to_currency},
            timeout=10,
        )
        resp.raise_for_status()
        result = resp.json()
        converted = result.get("rates", {}).get(to_currency)
        if converted is None:
            return jsonify({"error": "Conversion not available for that pair"}), 400
        return jsonify({
            "amount": amount,
            "from": from_currency,
            "to": to_currency,
            "converted": round(converted, 2),
        })
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Could not reach currency service: {e}"}), 500


if __name__ == "__main__":
    # Runs on http://localhost:5000
    app.run(debug=True, host="0.0.0.0", port=5000)

from flask import Flask, request, jsonify
import pickle
import numpy as np
import pandas as pd
from datetime import datetime

app = Flask(__name__)

# ── Load models on startup ──
with open('fraud_model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('label_encoder.pkl', 'rb') as f:
    le = pickle.load(f)

print("✅ Models loaded")

# ── Helper ──
def encode_city(city):
    try:
        return le.transform([city])[0]
    except:
        # unknown city → use 0
        return 0

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'timestamp': datetime.now().isoformat() })


@app.route('/detect-fraud', methods=['POST'])
def detect_fraud():
    try:
        body = request.get_json()

        price    = float(body.get('price', 0))
        area     = float(body.get('area', 300))
        bedrooms = int(body.get('bedrooms', 1))
        city     = str(body.get('city', 'Unknown'))

        city_encoded = encode_city(city)

        features = pd.DataFrame([{
            'price':        price,
            'area':         area,
            'bedrooms':     bedrooms,
            'city_encoded': city_encoded
        }])

        # anomaly score — more negative = more anomalous
        raw_score   = model.decision_function(features)[0]
        prediction  = model.predict(features)[0]  # -1 = fraud, 1 = normal

        # normalize score to 0-1 range (1 = highly fraudulent)
        fraud_score   = round(float(1 - (raw_score + 0.5)), 4)
        fraud_score   = max(0.0, min(1.0, fraud_score))
        anomaly_score = round(float(-raw_score), 4)
        is_fraudulent = bool(prediction == -1)

        return jsonify({
            'fraudScore':   fraud_score,
            'isFraudulent': is_fraudulent,
            'anomalyScore': anomaly_score,
            'features': {
                'price':    price,
                'area':     area,
                'bedrooms': bedrooms,
                'city':     city
            }
        })

    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


@app.route('/retrain', methods=['POST'])
def retrain():
    # placeholder — in production you'd retrain on new data
    return jsonify({
        'message': 'Retrain triggered',
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    app.run(port=5005, debug=True)
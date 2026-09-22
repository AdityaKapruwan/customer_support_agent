"""
Flask ML Microservice for Intent Prediction

Exposes REST API endpoints for customer support intent classification.
Loads Sentence Transformer and Logistic Regression models ONCE at application startup.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from predict import IntentPredictor
from sentiment import SentimentAnalyzer

# Load environment variables from .env file if present
load_dotenv()

app = Flask(__name__)

# Enable CORS to allow cross-origin requests from Node.js backend or React frontend
CORS(app)

# Environment variables configuration
PORT = int(os.getenv('PORT', 5001))
HOST = os.getenv('HOST', '0.0.0.0')
DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')

# Load models ONCE when Flask application starts
print("[Startup] Initializing IntentPredictor model artifacts...")
try:
    predictor = IntentPredictor()
    print("[Startup] Models successfully loaded and ready for serving requests.")
except Exception as e:
    print(f"[Startup CRITICAL ERROR] Failed to load ML models: {e}")
    predictor = None

# Load sentiment model separately so intent serving still works if sentiment fails
print("[Startup] Initializing SentimentAnalyzer model...")
try:
    sentiment_analyzer = SentimentAnalyzer()
    print("[Startup] Sentiment model successfully loaded.")
except Exception as e:
    print(f"[Startup WARNING] Failed to load sentiment model: {e}")
    sentiment_analyzer = None


@app.route('/health', methods=['GET'])
def health_check():
    """
    GET /health
    Health check endpoint confirming service status and model readiness.
    """
    models_ready = (predictor is not None) and (predictor.classifier is not None)
    sentiment_ready = sentiment_analyzer is not None
    status_code = 200 if models_ready else 503

    return jsonify({
        "status": "healthy" if models_ready else "unhealthy",
        "service": "ml-service",
        "models_loaded": models_ready,
        "sentiment_loaded": sentiment_ready
    }), status_code


@app.route('/predict', methods=['POST'])
def predict_endpoint():
    """
    POST /predict
    Request Body:
        { "query": "My payment was charged twice" }
    Response Body:
        {
            "intent": "billing",
            "confidence": 0.94,
            "probabilities": { ... }
        }
    """
    # 1. Ensure models are loaded
    if predictor is None:
        return jsonify({
            "error": "ML model service unavailable. Model artifacts failed to load."
        }), 503

    # 2. Validate JSON request payload
    if not request.is_json:
        return jsonify({
            "error": "Invalid Content-Type header. Request must be 'application/json'."
        }), 400

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Malformed or invalid JSON body payload."
        }), 400

    # 3. Validate 'query' field presence and type
    if 'query' not in data:
        return jsonify({
            "error": "Missing required field 'query' in JSON body."
        }), 400

    raw_query = data.get('query')

    if not isinstance(raw_query, str):
        return jsonify({
            "error": f"Invalid field type for 'query': Expected string, got {type(raw_query).__name__}."
        }), 400

    cleaned_query = raw_query.strip()
    if not cleaned_query:
        return jsonify({
            "error": "Field 'query' cannot be empty or whitespace."
        }), 400

    # 4. Perform prediction
    try:
        prediction_result = predictor.predict(cleaned_query)
        return jsonify(prediction_result), 200
    except Exception as e:
        return jsonify({
            "error": f"Inference processing failed: {str(e)}"
        }), 500


@app.route('/sentiment', methods=['POST'])
def sentiment_endpoint():
    """
    POST /sentiment
    Request Body:
        { "query": "This is terrible service!" }
    Response Body:
        {
            "label": "NEGATIVE",
            "score": 0.9912,
            "is_negative": true
        }
    """
    if sentiment_analyzer is None:
        return jsonify({
            "error": "Sentiment model unavailable."
        }), 503

    if not request.is_json:
        return jsonify({
            "error": "Invalid Content-Type header. Request must be 'application/json'."
        }), 400

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({
            "error": "Malformed or invalid JSON body payload."
        }), 400

    if 'query' not in data:
        return jsonify({
            "error": "Missing required field 'query' in JSON body."
        }), 400

    raw_query = data.get('query')
    if not isinstance(raw_query, str):
        return jsonify({
            "error": f"Invalid field type for 'query': Expected string, got {type(raw_query).__name__}."
        }), 400

    cleaned_query = raw_query.strip()
    if not cleaned_query:
        return jsonify({
            "error": "Field 'query' cannot be empty or whitespace."
        }), 400

    try:
        sentiment_result = sentiment_analyzer.analyze(cleaned_query)
        return jsonify(sentiment_result), 200
    except Exception as e:
        return jsonify({
            "error": f"Sentiment analysis failed: {str(e)}"
        }), 500


if __name__ == '__main__':
    print(f"Starting ML Microservice server on {HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=DEBUG)

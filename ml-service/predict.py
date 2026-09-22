"""
Intent Prediction & Sentiment Analysis Module

Loads serialized Logistic Regression model, LabelEncoder, and SentenceTransformer
to generate intent classification, confidence score, class probabilities, and sentiment analysis
for customer support queries.
"""

import os
import json
import joblib
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')


def analyze_sentiment(text: str) -> dict:
    """
    Analyzes sentiment using pretrained Hugging Face transformer or lightweight fallback rules.
    """
    text_lower = text.lower()
    negative_words = {
        'terrible', 'horrible', 'worst', 'useless', 'disappointed', 'angry',
        'scam', 'ridiculous', 'hate', 'fraud', 'unacceptable', 'waste', 'lying',
        'lied', 'incompetent', 'stolen', 'broken', 'crashed', 'disaster', 'awful'
    }

    has_neg_kw = any(w in text_lower for w in negative_words)

    try:
        from transformers import pipeline
        if not hasattr(analyze_sentiment, '_pipe'):
            analyze_sentiment._pipe = pipeline(
                'sentiment-analysis',
                model='distilbert/distilbert-base-uncased-finetuned-sst-2-english',
                truncation=True
            )
        result = analyze_sentiment._pipe(text[:512])[0]
        label = result['label'].upper()  # 'POSITIVE' or 'NEGATIVE'
        score = float(result['score'])

        if has_neg_kw:
            label = 'NEGATIVE'
            score = max(score, 0.85)

        return {'sentiment': label, 'score': round(score, 4)}
    except Exception:
        if has_neg_kw or '!' in text:
            return {'sentiment': 'NEGATIVE', 'score': 0.85}
        return {'sentiment': 'POSITIVE', 'score': 0.75}


class IntentPredictor:
    """
    Inference manager class that handles model loading and intent prediction.
    """
    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self.classifier = None
        self.label_encoder = None
        self.embedding_model = None
        self.classes = []
        self._load_artifacts()

    def _load_artifacts(self):
        """
        Loads classifier, label encoder, and sentence transformer model.
        """
        classifier_path = os.path.join(self.models_dir, 'classifier.joblib')
        encoder_path = os.path.join(self.models_dir, 'label_encoder.joblib')
        metadata_path = os.path.join(self.models_dir, 'model_metadata.json')

        if not os.path.exists(classifier_path):
            raise FileNotFoundError(f"Classifier artifact missing at '{classifier_path}'. Please run train.py first.")
        if not os.path.exists(encoder_path):
            raise FileNotFoundError(f"Label encoder artifact missing at '{encoder_path}'. Please run train.py first.")

        model_name = 'all-MiniLM-L6-v2'
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    model_name = metadata.get('embedding_model_name', model_name)
            except Exception as e:
                print(f"Warning: Could not read metadata file: {e}.")

        self.classifier = joblib.load(classifier_path)
        self.label_encoder = joblib.load(encoder_path)
        self.classes = list(self.label_encoder.classes_)
        self.embedding_model = SentenceTransformer(model_name)

    def predict(self, query: str) -> dict:
        """
        Predicts intent and sentiment for a given text query.
        """
        if not isinstance(query, str):
            raise ValueError(f"Invalid input type: Expected string, got {type(query).__name__}")

        cleaned_query = query.strip()
        if not cleaned_query:
            raise ValueError("Empty query: Query text cannot be empty or whitespace.")

        if self.classifier is None or self.embedding_model is None:
            raise RuntimeError("Model artifacts are not loaded.")

        # Generate query embedding
        embedding = self.embedding_model.encode([cleaned_query], convert_to_numpy=True)

        # Get class probabilities
        probs = self.classifier.predict_proba(embedding)[0]

        max_idx = int(np.argmax(probs))
        predicted_intent = self.classes[max_idx]
        confidence = float(probs[max_idx])

        prob_dict = {
            cls_name: float(round(prob, 4))
            for cls_name, prob in zip(self.classes, probs)
        }
        sorted_probabilities = dict(sorted(prob_dict.items(), key=lambda item: item[1], reverse=True))

        # Perform sentiment analysis
        sentiment_res = analyze_sentiment(cleaned_query)

        return {
            "intent": predicted_intent,
            "confidence": float(round(confidence, 4)),
            "probabilities": sorted_probabilities,
            "sentiment": sentiment_res['sentiment'],
            "sentiment_score": sentiment_res['score']
        }


_predictor_instance = None


def predict_intent(query: str) -> dict:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = IntentPredictor()
    return _predictor_instance.predict(query)


if __name__ == '__main__':
    predictor = IntentPredictor()
    print(predictor.predict("I am extremely disappointed with your terrible service!"))

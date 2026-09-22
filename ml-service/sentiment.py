"""
Sentiment analysis using a pretrained Hugging Face model.
No training required — the model is downloaded once on first use.
"""

from transformers import pipeline


class SentimentAnalyzer:
    """Wraps a lightweight DistilBERT sentiment classifier."""

    MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

    def __init__(self):
        print(f"[Sentiment] Loading pretrained model: {self.MODEL_NAME}")
        self.classifier = pipeline(
            "sentiment-analysis",
            model=self.MODEL_NAME,
            truncation=True,
            max_length=512
        )
        print("[Sentiment] Model ready.")

    def analyze(self, text: str) -> dict:
        """Return sentiment label, score, and a simple negative flag."""
        cleaned = (text or "").strip()
        if not cleaned:
            return {
                "label": "NEUTRAL",
                "score": 0.0,
                "is_negative": False
            }

        result = self.classifier(cleaned)[0]
        label = result["label"].upper()
        score = float(round(result["score"], 4))
        is_negative = label == "NEGATIVE" and score >= 0.65

        return {
            "label": label,
            "score": score,
            "is_negative": is_negative
        }

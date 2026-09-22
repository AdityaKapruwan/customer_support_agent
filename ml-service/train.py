"""
Intent Classifier Training Pipeline

This script loads the customer query dataset, generates sentence embeddings using
SentenceTransformers (all-MiniLM-L6-v2), trains a Logistic Regression classifier,
evaluates performance metrics (Accuracy, Precision, Recall, F1, Confusion Matrix),
and serializes model artifacts for real-time inference in predict.py.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from sentence_transformers import SentenceTransformer

# Define global constants & paths
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'intents.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')


def load_and_validate_dataset(csv_path: str) -> pd.DataFrame:
    """
    Loads and validates the intent dataset CSV file.
    
    Checks for:
    - File existence
    - Required columns ('query', 'intent')
    - Missing or empty values
    """
    print(f"[1/7] Loading dataset from: {csv_path}")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset file not found at '{csv_path}'")

    df = pd.read_csv(csv_path)

    # Validate required columns
    required_cols = {'query', 'intent'}
    if not required_cols.issubset(df.columns):
        raise ValueError(f"Dataset missing required columns: {required_cols - set(df.columns)}")

    # Clean whitespace and drop nulls
    df['query'] = df['query'].astype(str).str.strip()
    df['intent'] = df['intent'].astype(str).str.strip()

    initial_len = len(df)
    df = df[(df['query'] != '') & (df['intent'] != '')].dropna()
    cleaned_len = len(df)

    if initial_len != cleaned_len:
        print(f"  Dropped {initial_len - cleaned_len} empty or invalid rows.")

    print(f"  Successfully loaded {cleaned_len} valid records across {df['intent'].nunique()} unique intents.")
    return df


def encode_labels(intents: pd.Series):
    """
    Encodes categorical text intents into numeric integers.
    Returns numeric target array y and the fitted LabelEncoder.
    """
    print("[2/7] Encoding intent labels...")
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(intents)
    print(f"  Classes encoded: {list(label_encoder.classes_)}")
    return y, label_encoder


def split_data(queries: list, y: np.ndarray, test_size: float = 0.2, random_state: int = 42):
    """
    Splits queries and target labels into train and test sets using stratified sampling.
    """
    print(f"[3/7] Splitting data into train ({1-test_size:.0%}) and test ({test_size:.0%}) sets with stratification...")
    X_train_text, X_test_text, y_train, y_test = train_test_split(
        queries,
        y,
        test_size=test_size,
        stratify=y,
        random_state=random_state
    )
    print(f"  Training samples: {len(X_train_text)}, Testing samples: {len(X_test_text)}")
    return X_train_text, X_test_text, y_train, y_test


def generate_sentence_embeddings(model_name: str, train_texts: list, test_texts: list):
    """
    Uses Sentence Transformers (all-MiniLM-L6-v2) to convert text queries into dense vector embeddings.
    """
    print(f"[4/7] Loading Sentence Transformer model '{model_name}'...")
    embedding_model = SentenceTransformer(model_name)

    print("  Generating embeddings for training set...")
    X_train_emb = embedding_model.encode(train_texts, show_progress_bar=True, convert_to_numpy=True)

    print("  Generating embeddings for testing set...")
    X_test_emb = embedding_model.encode(test_texts, show_progress_bar=True, convert_to_numpy=True)

    print(f"  Embedding dimensions: {X_train_emb.shape[1]}")
    return X_train_emb, X_test_emb, embedding_model


def train_classifier(X_train_emb: np.ndarray, y_train: np.ndarray, random_state: int = 42) -> LogisticRegression:
    """
    Trains a Logistic Regression classifier on the sentence embeddings.
    """
    print("[5/7] Training Logistic Regression classifier...")
    classifier = LogisticRegression(
        max_iter=1000,
        random_state=random_state,
        C=1.0,
        solver='lbfgs'
    )
    classifier.fit(X_train_emb, y_train)
    print("  Model training completed successfully.")
    return classifier


def evaluate_classifier(classifier: LogisticRegression, X_test_emb: np.ndarray, y_test: np.ndarray, label_encoder: LabelEncoder):
    """
    Generates predictions on the test set and calculates evaluation metrics:
    - Accuracy
    - Precision
    - Recall
    - F1-Score
    - Confusion Matrix
    - Classification Report
    """
    print("\n[6/7] Evaluating classifier on test dataset...")
    y_pred = classifier.predict(X_test_emb)

    target_names = label_encoder.classes_

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted')
    rec = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 55)
    print("               MODEL PERFORMANCE METRICS               ")
    print("=" * 55)
    print(f"  Accuracy  : {acc:.4f} ({acc*100:.2f}%)")
    print(f"  Precision : {prec:.4f}")
    print(f"  Recall    : {rec:.4f}")
    print(f"  F1-Score  : {f1:.4f}")
    print("=" * 55)

    print("\nClassification Report:")
    print("-" * 55)
    print(classification_report(y_test, y_pred, target_names=target_names))

    print("\nConfusion Matrix:")
    print("-" * 55)
    cm_df = pd.DataFrame(cm, index=target_names, columns=target_names)
    print(cm_df.to_string())
    print("=" * 55)

    return {
        'accuracy': acc,
        'precision': prec,
        'recall': rec,
        'f1_score': f1,
        'confusion_matrix': cm.tolist()
    }


def save_artifacts(classifier: LogisticRegression, label_encoder: LabelEncoder, model_name: str, output_dir: str):
    """
    Saves trained classifier, label encoder, and model metadata to disk using joblib and JSON.
    """
    print(f"\n[7/7] Saving model artifacts to '{output_dir}'...")
    os.makedirs(output_dir, exist_ok=True)

    model_path = os.path.join(output_dir, 'classifier.joblib')
    encoder_path = os.path.join(output_dir, 'label_encoder.joblib')
    metadata_path = os.path.join(output_dir, 'model_metadata.json')

    joblib.dump(classifier, model_path)
    joblib.dump(label_encoder, encoder_path)

    metadata = {
        'embedding_model_name': model_name,
        'classes': list(label_encoder.classes_),
        'num_classes': len(label_encoder.classes_)
    }

    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    print(f"  Saved Classifier    : {model_path}")
    print(f"  Saved Label Encoder : {encoder_path}")
    print(f"  Saved Metadata      : {metadata_path}")
    print("All artifacts successfully saved!")


def run_pipeline():
    """
    Main execution pipeline function.
    """
    # 1. Load and validate
    df = load_and_validate_dataset(DATA_PATH)

    # 2. Encode labels
    y, label_encoder = encode_labels(df['intent'])
    queries = df['query'].tolist()

    # 3. Stratified split
    X_train_text, X_test_text, y_train, y_test = split_data(queries, y, test_size=0.2, random_state=42)

    # 4. Generate embeddings
    X_train_emb, X_test_emb, _ = generate_sentence_embeddings(EMBEDDING_MODEL_NAME, X_train_text, X_test_text)

    # 5. Train classifier
    classifier = train_classifier(X_train_emb, y_train)

    # 6. Evaluate model
    evaluate_classifier(classifier, X_test_emb, y_test, label_encoder)

    # 7. Save model artifacts
    save_artifacts(classifier, label_encoder, EMBEDDING_MODEL_NAME, MODELS_DIR)


if __name__ == '__main__':
    run_pipeline()

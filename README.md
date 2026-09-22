# 🤖 AI Customer Support Router

An intelligent customer support routing system that uses **Machine Learning and NLP** to classify customer queries, route them to the appropriate support agent, and escalate uncertain or problematic conversations to human support.

## 🚀 Features

* 🧠 **ML-based Intent Classification** using Sentence Transformers + Logistic Regression
* 🎯 **10 Support Intents** including billing, refund, order tracking, technical support, etc.
* 📊 **93% Test Accuracy** on a stratified 20% test set
* 🔀 **Confidence-Based Routing** with a 60% threshold
* ❓ **Automatic Clarification** for low-confidence queries
* 💬 **Multi-turn Conversation Memory** using MongoDB
* 🚨 **Human Escalation** for explicit agent requests, negative sentiment, repeated queries, and low-confidence streaks
* 👍 **User Feedback System**
* 📈 **Admin Dashboard** with ticket and routing analytics

## 🏗️ Architecture

```text
React Frontend
      ↓
Node.js + Express
      ↓
Python Flask ML Service
      ↓
Sentence Transformer
      ↓
Logistic Regression
      ↓
Intent + Confidence + Sentiment
      ↓
Routing / Clarification / Escalation
      ↓
MongoDB
```

## 🧠 Machine Learning

The system uses:

* **Embedding Model:** `all-MiniLM-L6-v2`
* **Embedding Size:** 384 dimensions
* **Classifier:** Multinomial Logistic Regression
* **Dataset:** 500 queries across 10 intents
* **Test Accuracy:** 93%

### Supported Intents

```text
account_access
billing
complaint
order_cancellation
order_tracking
product_information
refund
sales
subscription
technical_support
```

## 🔀 Routing Logic

```text
Confidence >= 60%
        ↓
Assign Support Agent

Confidence < 60%
        ↓
Ask Clarifying Question
```

Example:

```text
User:
"My card was charged twice."

Prediction:
Intent     → billing
Confidence → 70.26%
Agent      → Billing Agent
```

## 🛠️ Tech Stack

**Frontend:** React, Vite, CSS
**Backend:** Node.js, Express.js, Mongoose
**ML:** Python, Flask, Sentence Transformers, Scikit-learn
**Database:** MongoDB

## 📁 Project Structure

```text
ai-customer-support-router/
│
├── frontend/          # React application
├── backend/           # Node.js + Express API
├── ml-service/        # Python ML microservice
│   ├── data/
│   ├── models/
│   ├── train.py
│   ├── predict.py
│   └── app.py
│
├── .gitignore
└── README.md
```

## ⚙️ Run Locally

### 1. Train ML Model

```bash
cd ml-service
pip install -r requirements.txt
python train.py
```

### 2. Start ML Service

```bash
python app.py
```

Runs on:

```text
http://127.0.0.1:5001
```

### 3. Start Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `backend/.env` file with your MongoDB connection string and ML service URL. **Do not commit `.env` to GitHub.**

## 📌 Future Improvements

* Real-time WebSocket communication
* Human-agent live chat takeover
* Multilingual support
* Active learning and model retraining
* Docker-based deployment

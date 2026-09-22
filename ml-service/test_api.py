"""
Flask ML Service Test Suite

Sends test queries to the Flask ML Service (/predict endpoint), displays the predicted intent
and confidence score for each query, and verifies error handling for empty or invalid requests.
"""

import os
import sys
from app import app


def run_tests():
    # Use Flask's built-in test client for reliable, isolated HTTP endpoint testing
    client = app.test_client()

    print("=" * 70)
    print("            FLASK ML SERVICE HEALTH CHECK            ")
    print("=" * 70)

    health_res = client.get('/health')
    print(f"Endpoint : GET /health")
    print(f"Status   : {health_res.status_code}")
    print(f"Response : {health_res.get_json()}")
    print("=" * 70)

    print("\n" + "=" * 70)
    print("            INTENT PREDICTION TEST CASES             ")
    print("=" * 70)

    test_queries = [
        "My payment failed",
        "Where is my package?",
        "I want my money back",
        "My application keeps crashing",
        "I cannot login to my account",
        "Which premium plan should I buy?",
        "I want to cancel my order",
        "Something is wrong with my account"  # Intentionally ambiguous query
    ]

    for idx, query in enumerate(test_queries, 1):
        res = client.post('/predict', json={"query": query})
        data = res.get_json()

        print(f"\nQuery #{idx}:")
        print(f"  Query            : \"{query}\"")
        print(f"  Predicted Intent : {data.get('intent')}")
        print(f"  Confidence       : {data.get('confidence')}")

    print("\n" + "=" * 70)
    print("            ERROR HANDLING & VALIDATION TESTS            ")
    print("=" * 70)

    invalid_cases = [
        ("Empty String Query", {"query": ""}),
        ("Whitespace Only Query", {"query": "     "}),
        ("Missing 'query' Key", {"text": "hello"}),
        ("Invalid Type (Integer)", {"query": 9999}),
        ("Invalid Type (Boolean)", {"query": False})
    ]

    for label, payload in invalid_cases:
        res = client.post('/predict', json=payload)
        data = res.get_json()
        print(f"\nTest Case: {label}")
        print(f"  Payload          : {payload}")
        print(f"  HTTP Status Code : {res.status_code}")
        print(f"  Error Response   : {data.get('error')}")

    print("\n" + "=" * 70)
    print("                 ALL TESTS COMPLETED SUCCESSFULLY             ")
    print("=" * 70)


if __name__ == '__main__':
    run_tests()

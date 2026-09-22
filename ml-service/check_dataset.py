import os
import csv
from collections import Counter

def check_dataset(filepath):
    if not os.path.exists(filepath):
        print(f"Error: File '{filepath}' not found.")
        return

    queries = []
    intents = []
    missing_queries = 0
    missing_intents = 0
    total_records = 0

    with open(filepath, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_records += 1
            query = row.get('query', '').strip()
            intent = row.get('intent', '').strip()

            if not query:
                missing_queries += 1
            else:
                queries.append(query)

            if not intent:
                missing_intents += 1
            else:
                intents.append(intent)

    unique_queries = set()
    duplicate_count = 0
    for q in queries:
        if q in unique_queries:
            duplicate_count += 1
        else:
            unique_queries.add(q)

    print("=" * 45)
    print("        INTENT DATASET HEALTH CHECK        ")
    print("=" * 45)
    print(f"Total Records     : {total_records}")
    print(f"Missing Queries   : {missing_queries}")
    print(f"Missing Intents   : {missing_intents}")
    print(f"Duplicate Queries : {duplicate_count}")

    print("\nRecords Per Intent:")
    print("-" * 45)
    intent_counts = Counter(intents)
    for intent, count in sorted(intent_counts.items()):
        print(f"  {intent:<22}: {count}")

    print("=" * 45)

if __name__ == '__main__':
    dataset_path = os.path.join(os.path.dirname(__file__), 'data', 'intents.csv')
    check_dataset(dataset_path)

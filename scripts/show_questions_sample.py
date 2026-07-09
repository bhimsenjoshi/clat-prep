#!/usr/bin/env python3
import json

with open('/home/bhimsen_joshi/clat-prep/questions_for_review.json') as f:
    data = json.load(f)

for sk, sec in data['sections'].items():
    sep = "=" * 60
    print()
    print(sep)
    print("## {} ({} questions)".format(sec['name'], sec['count']))
    print(sep)
    for i, q in enumerate(sec['questions'][:2]):
        print()
        print("--- Question {} (id: {}) ---".format(i+1, q['id']))
        print("Difficulty: {}".format(q['difficulty']))
        print("Topic: {}".format(q['topic']))
        if q.get('passage'):
            print("Passage: {}...".format(q['passage'][:120]))
        print("Q: {}".format(q['question_text'][:120]))
        for k, v in q['options'].items():
            marker = '✓' if k == q['correct_option'] else ' '
            print("  [{}] {}. {}".format(marker, k, v))
        print("Explanation: {}...".format(q['explanation'][:120]))
        if q.get('tags'):
            print("Tags: {}".format(q['tags']))
    if len(sec['questions']) > 2:
        print("  ... ({} more questions)".format(len(sec['questions']) - 2))

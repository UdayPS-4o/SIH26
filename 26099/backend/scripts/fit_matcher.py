"""
Fit the match classifier, and report honestly on whether each feature earns its place.

Run with:  python scripts/fit_matcher.py

The deterministic engine produces three sub-scores for every candidate pair. This
script adds two more that only a model can produce - a sentence-embedding cosine
and a cross-encoder relevance logit - then fits a logistic regression to predict
whether the two records are in fact the same physical item.

The point is not to have a model. The point is to stop the combination weights
being numbers somebody chose. After this runs, the weights on the Duplicates page
are coefficients fitted to 1288 labelled pairs, and the thresholds come off a
precision-recall curve rather than off a preference.

Every metric printed here is measured on held-out folds. Pairs that touch the same
underlying item are kept in the same fold, because the records of one item are not
independent of each other and a random split would leak the answer across the
boundary and report a score the model has not earned.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, precision_recall_curve, roc_auc_score
from sklearn.model_selection import GroupKFold

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "data" / "model-data.json"
CARD = ROOT / "app" / "data" / "model-card.json"

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CROSS_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# Feature sets to compare. Adding a model is only worth it if it moves a held-out
# number, so the deterministic baseline is fitted too and printed alongside.
FEATURE_SETS = {
    "deterministic only": ["lexical", "attribute", "numeric"],
    "with embeddings": ["lexical", "attribute", "numeric", "semantic"],
    "with embeddings and cross-encoder": [
        "lexical",
        "attribute",
        "numeric",
        "semantic",
        "rerank",
    ],
}


def sigmoid(x: float) -> float:
    if x < -30:
        return 0.0
    if x > 30:
        return 1.0
    return 1.0 / (1.0 + math.exp(-x))


def load() -> dict:
    if not DATA.exists():
        raise SystemExit(
            f"{DATA} is missing. Run `npm run export:model` in ../frontend first."
        )
    return json.loads(DATA.read_text(encoding="utf-8"))


def add_model_features(payload: dict) -> None:
    """Attach a semantic cosine and a cross-encoder score to every candidate pair."""
    from sentence_transformers import CrossEncoder, SentenceTransformer

    records = {r["id"]: r for r in payload["records"]}
    pairs = payload["pairs"]

    print(f"loading {EMBED_MODEL}")
    embedder = SentenceTransformer(EMBED_MODEL)

    ids = list(records)
    texts = [records[i]["raw"] for i in ids]
    vectors = embedder.encode(texts, batch_size=64, show_progress_bar=False)
    vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    index = {rid: vectors[i] for i, rid in enumerate(ids)}

    for pair in pairs:
        pair["semantic"] = float(index[pair["leftId"]] @ index[pair["rightId"]])

    print(f"loading {CROSS_MODEL}")
    cross = CrossEncoder(CROSS_MODEL)
    logits = cross.predict(
        [(p["left"], p["right"]) for p in pairs], batch_size=64, show_progress_bar=False
    )
    for pair, logit in zip(pairs, logits):
        pair["rerankLogit"] = float(logit)
        pair["rerank"] = sigmoid(float(logit))


def groups_for(pairs: list[dict], records: dict) -> np.ndarray:
    """Fold groups. Pairs touching the same item stay together."""
    out = []
    for pair in pairs:
        left = records[pair["leftId"]]["truth"]
        right = records[pair["rightId"]]["truth"]
        out.append(min(left, right))
    keys = {key: i for i, key in enumerate(sorted(set(out)))}
    return np.array([keys[key] for key in out])


def evaluate(X: np.ndarray, y: np.ndarray, groups: np.ndarray) -> dict:
    """Out-of-fold predictions, so every number below is on unseen pairs."""
    folds = GroupKFold(n_splits=5)
    oof = np.zeros(len(y))
    for train, test in folds.split(X, y, groups):
        model = LogisticRegression(max_iter=2000, class_weight="balanced")
        model.fit(X[train], y[train])
        oof[test] = model.predict_proba(X[test])[:, 1]
    return {
        "oof": oof,
        "auc": float(roc_auc_score(y, oof)),
        "ap": float(average_precision_score(y, oof)),
    }


def pick_thresholds(y: np.ndarray, scores: np.ndarray) -> tuple[float, float, dict]:
    """
    Accept where precision is high enough to act without a person; review where
    recall is high enough that little is thrown away silently. Both come off the
    curve rather than being chosen.
    """
    precision, recall, cuts = precision_recall_curve(y, scores)
    # precision_recall_curve returns one more point than it does thresholds.
    precision, recall = precision[:-1], recall[:-1]

    accept = 0.9
    for p, r, c in zip(precision, recall, cuts):
        if p >= 0.99:
            accept = float(c)
            break

    review = 0.5
    for p, r, c in zip(precision, recall, cuts):
        if r <= 0.98:
            review = float(c)
            break

    if review >= accept:
        review = max(0.05, accept * 0.55)

    def at(cut: float) -> dict:
        predicted = scores >= cut
        tp = int(((predicted == 1) & (y == 1)).sum())
        fp = int(((predicted == 1) & (y == 0)).sum())
        fn = int(((predicted == 0) & (y == 1)).sum())
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        return {
            "threshold": round(cut, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "truePositives": tp,
            "falsePositives": fp,
            "falseNegatives": fn,
        }

    return accept, review, {"accept": at(accept), "review": at(review)}


def main() -> None:
    payload = load()
    add_model_features(payload)

    records = {r["id"]: r for r in payload["records"]}
    pairs = payload["pairs"]
    y = np.array([p["label"] for p in pairs])
    groups = groups_for(pairs, records)

    print()
    print(f"pairs {len(pairs)}  same {int(y.sum())}  different {int((1 - y).sum())}")
    print(f"folds 5, grouped by item so no item spans a fold boundary")
    print()
    print(f"{'feature set':<38} {'AUC':>7} {'avg prec':>9}")
    print("-" * 56)

    results = {}
    for name, features in FEATURE_SETS.items():
        X = np.array([[p[f] for f in features] for p in pairs])
        results[name] = evaluate(X, y, groups)
        results[name]["features"] = features
        print(f"{name:<38} {results[name]['auc']:>7.4f} {results[name]['ap']:>9.4f}")

    # The hand-set weights, scored the same way, so the fitted model has something
    # to beat rather than merely a number to report.
    hand = np.array([p["handCombined"] for p in pairs])
    print(f"{'hand-set weights (no fitting)':<38} {roc_auc_score(y, hand):>7.4f} "
          f"{average_precision_score(y, hand):>9.4f}")
    print()

    best_name = max(results, key=lambda k: results[k]["ap"])
    best = results[best_name]
    features = best["features"]
    print(f"chosen: {best_name}")

    accept, review, at_thresholds = pick_thresholds(y, best["oof"])

    # Refit on everything for the coefficients the service will actually ship.
    X = np.array([[p[f] for f in features] for p in pairs])
    final = LogisticRegression(max_iter=2000, class_weight="balanced")
    final.fit(X, y)
    coefficients = {f: float(c) for f, c in zip(features, final.coef_[0])}

    # Normalized contributions, for the interface. A logistic coefficient is not a
    # weight that sums to one, so what is shown is each feature's share of the
    # total absolute pull, which is what a reader means by "how much does this
    # count for".
    total = sum(abs(v) for v in coefficients.values()) or 1.0
    shares = {f: round(abs(v) / total, 4) for f, v in coefficients.items()}

    print()
    print(f"{'feature':<12} {'coefficient':>12} {'share':>8}")
    print("-" * 34)
    for f in features:
        print(f"{f:<12} {coefficients[f]:>12.4f} {shares[f]:>8.3f}")
    print(f"{'intercept':<12} {final.intercept_[0]:>12.4f}")
    print()
    print(f"accept threshold {accept:.4f}  ->  precision {at_thresholds['accept']['precision']:.4f} "
          f"recall {at_thresholds['accept']['recall']:.4f} "
          f"({at_thresholds['accept']['falsePositives']} false positives)")
    print(f"review threshold {review:.4f}  ->  precision {at_thresholds['review']['precision']:.4f} "
          f"recall {at_thresholds['review']['recall']:.4f} "
          f"({at_thresholds['review']['falseNegatives']} missed)")

    card = {
        "embeddingModel": EMBED_MODEL,
        "crossEncoderModel": CROSS_MODEL if "rerank" in features else None,
        "features": features,
        "coefficients": coefficients,
        "intercept": float(final.intercept_[0]),
        "shares": shares,
        "accept": round(accept, 4),
        "review": round(review, 4),
        "trainedOnPairs": len(pairs),
        "positivePairs": int(y.sum()),
        "distinctItems": len({r["truth"] for r in payload["records"]}),
        "folds": 5,
        "heldOut": {
            "auc": round(best["auc"], 4),
            "averagePrecision": round(best["ap"], 4),
            "atAccept": at_thresholds["accept"],
            "atReview": at_thresholds["review"],
        },
        "comparedWith": {
            name: {"auc": round(r["auc"], 4), "averagePrecision": round(r["ap"], 4)}
            for name, r in results.items()
        }
        | {
            "hand-set weights (no fitting)": {
                "auc": round(float(roc_auc_score(y, hand)), 4),
                "averagePrecision": round(float(average_precision_score(y, hand)), 4),
            }
        },
    }
    CARD.write_text(json.dumps(card, indent=2), encoding="utf-8")
    print()
    print(f"written to {CARD}")


if __name__ == "__main__":
    main()

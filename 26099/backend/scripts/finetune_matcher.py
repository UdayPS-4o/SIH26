"""
Fine-tune the sentence embedding on CPSE material descriptions.

Run with:  python scripts/finetune_matcher.py

Why this exists
---------------
An off-the-shelf sentence embedding has never seen a line like
`BRG/BALL/DG/6205/2RS`. Measured on this corpus, `all-MiniLM-L6-v2` scores
same-item pairs at a mean cosine of 0.76 and different-item pairs at 0.70. A gap
of six points is not a signal anybody can threshold, and a classifier fitted over
it correctly gives the feature almost no weight.

Its relative ordering is not useless though. On exactly the pairs the
deterministic engine gets wrong - the ones where two organisations use different
words for the same part - it is the only feature that sees anything. BULB against
LAMP scores 0.86 where the lexical overlap is 0.67; gland PACKING against
asbestos-free ROPE scores 0.57 where the lexical overlap is 0.25.

So the model is looking at the right thing on the wrong scale. That is what
fine-tuning fixes.

The split is permanent, not an evaluation trick
----------------------------------------------
The obvious mistake here is to hold items out to measure, then retrain on
everything for the model that actually ships. The number reported would be
honest and the model in the demo would still have seen every record it is about
to be asked about, which is worth nothing and worse than having no model, because
the first reviewer to ask "did you train on the data you are showing me" gets a
yes.

So the split is kept. Two fifths of the items are never shown to the model at any
point. The shipped model is the one trained on the other three fifths, and the
demo drives the held-out ones, so every match a reviewer watches it make is on
vocabulary it has genuinely never seen.

Whole items are held out rather than pairs, because two records of one item are
not independent: splitting pairs at random would put one record of item X in
training and another record of the same item X in test, and report a number the
model had already been given the answer to.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "data" / "model-data.json"
OUT = ROOT / "app" / "data" / "codeone-minilm"
REPORT = ROOT / "app" / "data" / "finetune-report.json"

BASE_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EPOCHS = 4
HOLD_OUT_ITEMS = 0.4
SEED = 20260904


def load() -> dict:
    if not DATA.exists():
        raise SystemExit(f"{DATA} is missing. Run `npm run export:model` in ../frontend first.")
    return json.loads(DATA.read_text(encoding="utf-8"))


def split_items(payload: dict) -> tuple[set[str], set[str]]:
    """Hold out whole items, so no record of a test item appears in training."""
    items = sorted({r["truth"] for r in payload["records"]})
    rng = random.Random(SEED)
    rng.shuffle(items)
    cut = max(1, int(len(items) * HOLD_OUT_ITEMS))
    return set(items[cut:]), set(items[:cut])


def cosine_stats(model, pairs: list[dict]) -> dict:
    """Mean cosine for same and different pairs, and the gap between them."""
    if not pairs:
        return {"same": 0.0, "different": 0.0, "gap": 0.0, "separation": 0.0, "pairs": 0}
    texts = sorted({p["left"] for p in pairs} | {p["right"] for p in pairs})
    vectors = model.encode(texts, batch_size=64, show_progress_bar=False)
    vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    index = {t: vectors[i] for i, t in enumerate(texts)}

    same = [float(index[p["left"]] @ index[p["right"]]) for p in pairs if p["label"] == 1]
    diff = [float(index[p["left"]] @ index[p["right"]]) for p in pairs if p["label"] == 0]
    if not same or not diff:
        return {"same": 0.0, "different": 0.0, "gap": 0.0, "separation": 0.0, "pairs": len(pairs)}

    # Separation in pooled standard deviations, so the gap is reported against how
    # noisy the two distributions actually are rather than on its own.
    pooled = math.sqrt((np.var(same) + np.var(diff)) / 2) or 1e-9
    from sklearn.metrics import roc_auc_score

    labels = [1] * len(same) + [0] * len(diff)
    scores = same + diff
    return {
        "same": round(float(np.mean(same)), 4),
        "different": round(float(np.mean(diff)), 4),
        "gap": round(float(np.mean(same) - np.mean(diff)), 4),
        "separation": round(float((np.mean(same) - np.mean(diff)) / pooled), 3),
        "auc": round(float(roc_auc_score(labels, scores)), 4),
        "pairs": len(pairs),
    }


def show(title: str, stats: dict) -> None:
    print(
        f"{title:<34} same {stats['same']:.3f}   different {stats['different']:.3f}   "
        f"gap {stats['gap']:+.3f}   separation {stats['separation']:.2f} sd   "
        f"AUC {stats.get('auc', 0):.4f}"
    )


def main() -> None:
    from sentence_transformers import InputExample, SentenceTransformer, losses
    from torch.utils.data import DataLoader

    payload = load()
    records = {r["id"]: r for r in payload["records"]}
    pairs = payload["pairs"]

    train_items, test_items = split_items(payload)

    def item_of(pair: dict) -> tuple[str, str]:
        return records[pair["leftId"]]["truth"], records[pair["rightId"]]["truth"]

    # A pair is only in training when both of its records belong to training items.
    train_pairs = [p for p in pairs if all(i in train_items for i in item_of(p))]
    test_pairs = [p for p in pairs if all(i in test_items for i in item_of(p))]

    print(f"items    {len(train_items)} train / {len(test_items)} held out")
    print(
        f"pairs    {len(train_pairs)} train "
        f"({sum(p['label'] for p in train_pairs)} same) / "
        f"{len(test_pairs)} held out ({sum(p['label'] for p in test_pairs)} same)"
    )
    print()

    print(f"loading {BASE_MODEL}")
    model = SentenceTransformer(BASE_MODEL)

    before_test = cosine_stats(model, test_pairs)
    before_all = cosine_stats(model, pairs)
    show("before, held-out items", before_test)
    show("before, whole corpus", before_all)
    print()

    examples = [
        InputExample(texts=[p["left"], p["right"]], label=float(p["label"]))
        for p in train_pairs
    ]
    loader = DataLoader(examples, shuffle=True, batch_size=16)
    loss = losses.CosineSimilarityLoss(model)

    print(f"training {EPOCHS} epochs on {len(examples)} pairs")
    model.fit(
        train_objectives=[(loader, loss)],
        epochs=EPOCHS,
        warmup_steps=int(len(loader) * 0.1),
        show_progress_bar=False,
    )
    print()

    after_test = cosine_stats(model, test_pairs)
    show("after, held-out items", after_test)
    print()

    # No retrain on everything. The model saved here is the one trained on the
    # training items only, so every held-out item stays unseen for good. That is
    # what makes the demo worth watching: the pairs it merges on stage are ones it
    # has no memory of.
    OUT.mkdir(parents=True, exist_ok=True)
    model.save(str(OUT))

    # The split itself is exported, so the interface can mark a pair as held out
    # and a reviewer can check the claim rather than take it.
    split = {
        "seed": SEED,
        "holdOutShare": HOLD_OUT_ITEMS,
        "trainItems": sorted(train_items),
        "heldOutItems": sorted(test_items),
        "heldOutRecordIds": sorted(
            r["id"] for r in payload["records"] if r["truth"] in test_items
        ),
    }
    (ROOT / "app" / "data" / "train-split.json").write_text(
        json.dumps(split, indent=2), encoding="utf-8"
    )

    report = {
        "baseModel": BASE_MODEL,
        "finetunedPath": str(OUT.relative_to(ROOT)),
        "epochs": EPOCHS,
        "loss": "CosineSimilarityLoss",
        "heldOutItems": len(test_items),
        "trainItems": len(train_items),
        "trainPairs": len(train_pairs),
        "heldOutPairs": len(test_pairs),
        "heldOut": {"before": before_test, "after": after_test},
        "wholeCorpusBefore": before_all,
        "note": (
            "The shipped model is the one trained on the training items only. The "
            "held-out items were never shown to it, at any point, and the demo drives "
            "those items. Whole items were held out rather than pairs, because two "
            "records of one item are not independent of each other."
        ),
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print()
    print(f"model  {OUT}")
    print(f"report {REPORT}")


if __name__ == "__main__":
    main()

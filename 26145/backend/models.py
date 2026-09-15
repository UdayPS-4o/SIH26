"""
Machine learning models for cyber threat detection.

Provides model wrappers around scikit-learn IsolationForest and
LogisticRegression classifiers. Models are trained on synthetic flow
features and produce per-flow anomaly/attack-type scores.
"""

from __future__ import annotations

import hashlib
import logging
import os
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from features import extract_flow_features, features_to_vector

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class ModelResult:
    """Result of running a model inference on a flow feature vector."""

    is_anomaly: bool = False
    anomaly_score: float = 0.0       # higher = more anomalous (0 to 1)
    attack_type: str = "benign"
    attack_confidence: float = 0.0    # confidence in attack_type classification
    model_version: str = "v1.0"


# ---------------------------------------------------------------------------
# IsolationForest anomaly detector
# ---------------------------------------------------------------------------

class AnomalyDetector:
    """Wraps an IsolationForest for unsupervised anomaly detection.

    IsolationForest isolates anomalies by randomly partitioning the feature
    space. Anomalies are easier to isolate, so they have shorter path lengths
    in the trees.
    """

    FEATURE_DIM = 15  # must match features_to_vector output

    def __init__(self, contamination: float = 0.05, random_state: int = 42) -> None:
        """Initialize the anomaly detector.

        Args:
            contamination: Expected proportion of anomalies in the data.
            random_state: Random seed for reproducibility.
        """
        self.model: IsolationForest = IsolationForest(
            n_estimators=200,
            max_samples="auto",
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1,
        )
        self.scaler: StandardScaler = StandardScaler()
        self._trained: bool = False
        self._threshold: float = -0.1  # decision_function threshold
        self.version: str = "v1.0"

    def train(self, X: np.ndarray) -> None:
        """Fit the model on benign + attack flow features.

        Args:
            X: Feature matrix of shape (n_samples, n_features).
        """
        logger.info("Training anomaly detector on %d samples, %d features", X.shape[0], X.shape[1])
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self._trained = True

        # Compute threshold from training data (score at 95th percentile)
        scores = self.model.decision_function(X_scaled)
        self._threshold = float(np.percentile(scores, 5))
        logger.info("Anomaly detector trained. Threshold set to %.4f", self._threshold)

    def predict(self, features: np.ndarray) -> ModelResult:
        """Run inference on a single feature vector.

        Args:
            features: 1-D feature array of shape (n_features,).

        Returns:
            ModelResult with anomaly flag and score.
        """
        if features.ndim == 1:
            features = features.reshape(1, -1)

        if not self._trained:
            # Return safe defaults when not trained
            return ModelResult()

        X_scaled = self.scaler.transform(features)
        score = float(self.model.decision_function(X_scaled)[0])

        # Normalize score to [0, 1] range (0 = normal, 1 = anomalous)
        # IsolationForest returns negative scores for anomalies.
        # We invert and clip to [0, 1].
        raw_score = max(0.0, -score)
        normalized_score = min(1.0, raw_score / 0.5)  # 0.5 is a reasonable max

        is_anomaly = score < self._threshold

        return ModelResult(
            is_anomaly=is_anomaly,
            anomaly_score=round(normalized_score, 4),
            model_version=self.version,
        )

    def save(self, path: str) -> None:
        """Persist the trained model to disk."""
        data = {
            "model": self.model,
            "scaler": self.scaler,
            "threshold": self._threshold,
            "version": self.version,
        }
        with open(path, "wb") as f:
            pickle.dump(data, f)
        logger.info("Anomaly model saved to %s", path)

    def load(self, path: str) -> None:
        """Load a persisted model from disk."""
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.scaler = data["scaler"]
        self._threshold = data["threshold"]
        self.version = data.get("version", "unknown")
        self._trained = True
        logger.info("Anomaly model loaded from %s (version %s)", path, self.version)


# ---------------------------------------------------------------------------
# Logistic regression attack-type classifier
# ---------------------------------------------------------------------------

class AttackClassifier:
    """Multi-class classifier that predicts the type of attack.

    Uses logistic regression to classify flows into one of several
    attack categories (DDoS, botnet, DGA, etc.) or benign.
    """

    ATTACK_TYPES = [
        "ddos",
        "port_scan",
        "data_exfiltration",
        "dns_tunneling",
        "dga",
        "botnet",
        "tls_beaconing",
        "benign",
    ]

    FEATURE_DIM = 15

    def __init__(self, random_state: int = 42) -> None:
        """Initialize the attack classifier.

        Args:
            random_state: Random seed for reproducibility.
        """
        self.scaler: StandardScaler = StandardScaler()
        self.model: LogisticRegression = LogisticRegression(
            max_iter=1000,
            random_state=random_state,
            solver="lbfgs",
            C=1.0,
        )
        self._trained: bool = False
        self.version: str = "v1.0"

    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        """Fit the classifier on labeled flow features.

        Args:
            X: Feature matrix of shape (n_samples, n_features).
            y: Label array of shape (n_samples,) with attack type strings.
        """
        logger.info(
            "Training attack classifier on %d samples across %d classes",
            X.shape[0],
            len(set(y)),
        )
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self._trained = True

        # Log training accuracy
        train_acc = self.model.score(X_scaled, y)
        logger.info("Attack classifier trained. Training accuracy: %.2f%%", train_acc * 100)

    def predict(self, features: np.ndarray) -> tuple[str, float]:
        """Predict the attack type for a single feature vector.

        Args:
            features: 1-D feature array of shape (n_features,).

        Returns:
            Tuple of (attack_type, confidence).
        """
        if features.ndim == 1:
            features = features.reshape(1, -1)

        if not self._trained:
            return "benign", 0.0

        X_scaled = self.scaler.transform(features)
        probs = self.model.predict_proba(X_scaled)[0]
        best_idx = int(np.argmax(probs))
        confidence = round(float(probs[best_idx]), 4)

        return self.ATTACK_TYPES[best_idx], confidence

    def save(self, path: str) -> None:
        """Persist the trained model to disk."""
        data = {
            "model": self.model,
            "scaler": self.scaler,
            "version": self.version,
            "attack_types": self.ATTACK_TYPES,
        }
        with open(path, "wb") as f:
            pickle.dump(data, f)
        logger.info("Attack classifier saved to %s", path)

    def load(self, path: str) -> None:
        """Load a persisted model from disk."""
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.scaler = data["scaler"]
        self.version = data.get("version", "unknown")
        self._trained = True
        logger.info("Attack classifier loaded from %s (version %s)", path, self.version)


# ---------------------------------------------------------------------------
# Model factory and synthetic training data generation
# ---------------------------------------------------------------------------

def _generate_synthetic_training_data(n_samples: int = 5000, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """Generate synthetic training data for model initialization.

    This creates labeled flow features so the models can be trained
    at startup without requiring a real dataset. The synthetic data
    has realistic statistical properties per attack type.

    Args:
        n_samples: Number of samples to generate.
        seed: Random seed.

    Returns:
        Tuple of (X, y) where X is (n_samples, 15) and y is (n_samples,).
    """
    rng = np.random.RandomState(seed)
    n_per_class = n_samples // len(AttackClassifier.ATTACK_TYPES)

    X_list: list[np.ndarray] = []
    y_list: list[str] = []

    for label in AttackClassifier.ATTACK_TYPES:
        if label == "benign":
            # Benign flows: moderate bytes, normal intervals, varied ports
            x = np.column_stack([
                rng.lognormal(8, 1.5, n_per_class),          # bytes_sent
                rng.lognormal(9, 1.5, n_per_class),          # bytes_recv
                rng.uniform(0.1, 5.0, n_per_class),          # byte_ratio
                rng.uniform(0.01, 10.0, n_per_class),        # duration
                rng.randint(1, 50, n_per_class),             # packets
                rng.uniform(100, 1500, n_per_class),         # avg_packet_size
                rng.uniform(100, 50000, n_per_class),        # bytes_per_sec
                rng.uniform(1, 5000, n_per_class),           # packets_per_sec
                rng.uniform(0, 1, n_per_class),              # src_port/65535
                rng.choice([0.0, 0.02, 0.08, 0.3, 1.0], n_per_class),  # dst_port/65535
                rng.randint(0, 2, n_per_class),              # is_well_known
                rng.randint(0, 2, n_per_class),              # is_ephemeral
                rng.uniform(0, 0.5, n_per_class),            # dns_query_len/255
                rng.uniform(0, 4, n_per_class),              # dns_entropy/8
                rng.choice([0, 1], n_per_class, p=[0.7, 0.3]),  # has_tls
            ])
        elif label == "ddos":
            # DDoS: very high packet rates, many flows to few destinations
            x = np.column_stack([
                rng.uniform(40, 80, n_per_class),            # bytes_sent (small SYN)
                rng.uniform(0, 20, n_per_class),             # bytes_recv
                rng.uniform(10, 100, n_per_class),           # byte_ratio
                rng.uniform(0.001, 0.1, n_per_class),        # duration (very short)
                rng.uniform(1, 5, n_per_class),              # packets (few per flow)
                rng.uniform(40, 80, n_per_class),            # avg_packet_size
                rng.uniform(50000, 1000000, n_per_class),    # bytes_per_sec (high)
                rng.uniform(1000, 50000, n_per_class),       # packets_per_sec
                rng.uniform(0, 0.5, n_per_class),            # src_port
                rng.choice([0.0, 0.02], n_per_class),        # dst_port (targeted)
                rng.randint(0, 2, n_per_class),              # is_well_known
                rng.randint(0, 2, n_per_class),              # is_ephemeral
                rng.uniform(0, 0.05, n_per_class),           # dns_query_len
                rng.uniform(0, 0.5, n_per_class),            # dns_entropy
                np.zeros(n_per_class),                      # has_tls (SYN floods not TLS)
            ])
        elif label == "port_scan":
            # Port scan: many unique dst ports, low bytes, sequential
            x = np.column_stack([
                rng.uniform(40, 100, n_per_class),           # bytes_sent
                rng.uniform(0, 40, n_per_class),             # bytes_recv
                rng.uniform(5, 50, n_per_class),             # byte_ratio
                rng.uniform(0.001, 0.05, n_per_class),       # duration
                rng.uniform(1, 3, n_per_class),              # packets
                rng.uniform(40, 100, n_per_class),           # avg_packet_size
                rng.uniform(1000, 50000, n_per_class),       # bytes_per_sec
                rng.uniform(10, 1000, n_per_class),          # packets_per_sec
                rng.uniform(0, 0.2, n_per_class),            # src_port
                rng.uniform(0, 1, n_per_class),              # dst_port (any port)
                rng.randint(0, 2, n_per_class),              # is_well_known
                rng.randint(0, 2, n_per_class),              # is_ephemeral
                np.zeros(n_per_class),                      # dns_query_len
                np.zeros(n_per_class),                      # dns_entropy
                rng.choice([0, 1], n_per_class, p=[0.8, 0.2]),  # has_tls
            ])
        elif label == "data_exfiltration":
            # Data exfiltration: very high outbound bytes, unusual ports
            x = np.column_stack([
                rng.uniform(50000, 500000, n_per_class),     # bytes_sent (huge)
                rng.uniform(0, 1000, n_per_class),           # bytes_recv
                rng.uniform(50, 500, n_per_class),           # byte_ratio
                rng.uniform(1, 60, n_per_class),             # duration
                rng.uniform(100, 5000, n_per_class),         # packets
                rng.uniform(500, 2000, n_per_class),         # avg_packet_size
                rng.uniform(10000, 500000, n_per_class),     # bytes_per_sec
                rng.uniform(100, 10000, n_per_class),        # packets_per_sec
                rng.uniform(0, 0.3, n_per_class),            # src_port
                rng.uniform(0.5, 1.0, n_per_class),          # dst_port (high ports)
                np.zeros(n_per_class),                      # is_well_known
                np.ones(n_per_class),                       # is_ephemeral
                np.zeros(n_per_class),                      # dns_query_len
                np.zeros(n_per_class),                      # dns_entropy
                rng.choice([0, 1], n_per_class, p=[0.3, 0.7]),  # has_tls
            ])
        elif label == "dns_tunneling":
            # DNS tunneling: high DNS query lengths, high entropy
            x = np.column_stack([
                rng.uniform(100, 2000, n_per_class),         # bytes_sent
                rng.uniform(0, 500, n_per_class),            # bytes_recv
                rng.uniform(0.5, 10, n_per_class),           # byte_ratio
                rng.uniform(0.1, 5, n_per_class),            # duration
                rng.uniform(1, 20, n_per_class),             # packets
                rng.uniform(50, 500, n_per_class),           # avg_packet_size
                rng.uniform(1000, 100000, n_per_class),      # bytes_per_sec
                rng.uniform(10, 2000, n_per_class),          # packets_per_sec
                rng.uniform(0, 0.5, n_per_class),            # src_port
                rng.uniform(0.0, 0.01, n_per_class),         # dst_port (DNS = 53)
                np.ones(n_per_class),                       # is_well_known
                rng.randint(0, 2, n_per_class),              # is_ephemeral
                rng.uniform(100, 255, n_per_class),          # dns_query_len (long)
                rng.uniform(3, 7, n_per_class),              # dns_entropy (high)
                np.zeros(n_per_class),                      # has_tls
            ])
        elif label == "dga":
            # DGA: DNS queries with high entropy, random-looking domains
            x = np.column_stack([
                rng.uniform(40, 200, n_per_class),           # bytes_sent
                rng.uniform(0, 200, n_per_class),            # bytes_recv
                rng.uniform(0.5, 3, n_per_class),            # byte_ratio
                rng.uniform(0.01, 2, n_per_class),           # duration
                rng.uniform(1, 10, n_per_class),             # packets
                rng.uniform(40, 200, n_per_class),           # avg_packet_size
                rng.uniform(100, 20000, n_per_class),        # bytes_per_sec
                rng.uniform(10, 2000, n_per_class),          # packets_per_sec
                rng.uniform(0, 0.5, n_per_class),            # src_port
                rng.uniform(0.0, 0.01, n_per_class),         # dst_port (DNS)
                np.ones(n_per_class),                       # is_well_known
                rng.randint(0, 2, n_per_class),              # is_ephemeral
                rng.uniform(10, 63, n_per_class),            # dns_query_len
                rng.uniform(4, 7.5, n_per_class),            # dns_entropy (very high)
                np.zeros(n_per_class),                      # has_tls
            ])
        elif label == "botnet":
            # Botnet beaconing: periodic, consistent sizes, known C2 ports
            x = np.column_stack([
                rng.uniform(100, 600, n_per_class),          # bytes_sent
                rng.uniform(50, 300, n_per_class),           # bytes_recv
                rng.uniform(1, 4, n_per_class),              # byte_ratio
                rng.uniform(0.1, 3, n_per_class),            # duration
                rng.uniform(1, 5, n_per_class),              # packets
                rng.uniform(100, 300, n_per_class),          # avg_packet_size
                rng.uniform(100, 50000, n_per_class),        # bytes_per_sec
                rng.uniform(10, 3000, n_per_class),          # packets_per_sec
                rng.uniform(0, 0.5, n_per_class),            # src_port
                rng.uniform(0.3, 0.8, n_per_class),          # dst_port (C2 ports)
                rng.choice([0, 1], n_per_class),             # is_well_known
                rng.randint(0, 2, n_per_class),              # is_ephemeral
                rng.uniform(0, 0.2, n_per_class),            # dns_query_len
                rng.uniform(0, 2, n_per_class),              # dns_entropy
                rng.choice([0, 1], n_per_class, p=[0.2, 0.8]),  # has_tls
            ])
        elif label == "tls_beaconing":
            # TLS beaconing: periodic TLS connections, consistent sizing
            x = np.column_stack([
                rng.uniform(50, 200, n_per_class),           # bytes_sent
                rng.uniform(50, 200, n_per_class),           # bytes_recv
                rng.uniform(0.8, 1.2, n_per_class),          # byte_ratio (balanced)
                rng.uniform(0.1, 2, n_per_class),            # duration
                rng.uniform(1, 3, n_per_class),              # packets
                rng.uniform(50, 200, n_per_class),           # avg_packet_size
                rng.uniform(50, 50000, n_per_class),         # bytes_per_sec
                rng.uniform(10, 3000, n_per_class),          # packets_per_sec
                rng.uniform(0, 0.3, n_per_class),            # src_port
                rng.uniform(0.3, 0.8, n_per_class),          # dst_port
                rng.randint(0, 2, n_per_class),              # is_well_known
                rng.randint(0, 2, n_per_class),              # is_ephemeral
                np.zeros(n_per_class),                      # dns_query_len
                np.zeros(n_per_class),                      # dns_entropy
                np.ones(n_per_class),                       # has_tls
            ])
        else:
            continue  # should not happen

        X_list.append(x)
        y_list.extend([label] * n_per_class)

    X = np.vstack(X_list).astype(np.float32)
    y = np.array(y_list)

    # Shuffle
    idx = rng.permutation(len(y))
    return X[idx], y[idx]


def build_models() -> tuple[AnomalyDetector, AttackClassifier]:
    """Create, train, and return both models with synthetic data.

    Returns:
        Tuple of (anomaly_detector, attack_classifier).
    """
    logger.info("Generating synthetic training data...")
    X, y = _generate_synthetic_training_data(n_samples=5000)

    # Split benign vs attack for anomaly detector
    # IsolationForest trains on all data (benign + attack)
    anomaly_detector = AnomalyDetector(contamination=0.15)
    anomaly_detector.train(X)

    # Attack classifier trains only on known attack types
    # (benign samples help the classifier learn the full distribution)
    attack_classifier = AttackClassifier()
    attack_classifier.train(X, y)

    logger.info("Models built and trained successfully.")
    return anomaly_detector, attack_classifier


# ---------------------------------------------------------------------------
# Combined ensemble used by the server
# ---------------------------------------------------------------------------

class DetectionEnsemble:
    """Combines the anomaly detector and attack classifier behind one API."""

    MODELS_DIR = Path(__file__).resolve().parent / "models"

    def __init__(self) -> None:
        self.anomaly_detector: Optional[AnomalyDetector] = None
        self.attack_classifier: Optional[AttackClassifier] = None
        self._models_loaded: bool = False

    def load_models(self) -> None:
        """Load persisted models from disk, falling back to freshly-trained
        synthetic models when no compatible artifacts are found.
        """
        anomaly_detector = AnomalyDetector()
        attack_classifier = AttackClassifier()

        try:
            anomaly_detector.load(str(self.MODELS_DIR / "anomaly_detector_v2.pkl"))
            attack_classifier.load(str(self.MODELS_DIR / "attack_classifier.pkl"))
        except Exception as e:
            logger.info("No compatible persisted models found (%s); training on synthetic data", e)
            anomaly_detector, attack_classifier = build_models()

        self.anomaly_detector = anomaly_detector
        self.attack_classifier = attack_classifier
        self._models_loaded = True

    def detect(self, flow: dict, context: dict | None = None) -> dict:
        """Run the ensemble on a single flow.

        Args:
            flow: Flow dictionary from the simulator.
            context: Optional detection context (unused by the ML models,
                kept for interface parity with the rule-based detector).

        Returns:
            Dictionary describing the combined ML verdict for the flow.
        """
        if not self._models_loaded or self.anomaly_detector is None or self.attack_classifier is None:
            return {"is_threat": False}

        vector = features_to_vector(extract_flow_features(flow))
        anomaly_result = self.anomaly_detector.predict(vector)
        attack_type, attack_confidence = self.attack_classifier.predict(vector)

        is_threat = anomaly_result.is_anomaly or (attack_type != "benign" and attack_confidence > 0.5)

        return {
            "is_threat": is_threat,
            "anomaly_score": anomaly_result.anomaly_score,
            "attack_type": attack_type,
            "attack_confidence": attack_confidence,
        }

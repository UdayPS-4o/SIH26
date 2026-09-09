"""C2 Beaconing detector.

Detects periodic C2 check-in traffic by analyzing inter-arrival times
between connections to the same destination. Uses robust statistics
(MAD, Bowley skewness) to detect machine-like regularity with jitter tolerance.
"""
import math
import statistics
from collections import defaultdict
from detectors.base import BaseDetector


def shannon_entropy(values):
    if not values:
        return 0.0
    total = len(values)
    counts = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    entropy = 0.0
    for count in counts.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)
    return entropy


def bowley_skewness(values):
    """Calculate Bowley's quartile skewness (robust, outlier-resistant)."""
    if len(values) < 4:
        return 0.0
    sorted_v = sorted(values)
    n = len(sorted_v)
    q1_idx = n // 4
    q3_idx = 3 * n // 4
    q1 = sorted_v[q1_idx]
    q3 = sorted_v[q3_idx]
    iqr = q3 - q1
    if iqr == 0:
        return 0.0
    median = sorted_v[n // 2]
    return (q1 + q3 - 2 * median) / iqr


def median_absolute_deviation(values):
    """Calculate Median Absolute Deviation - robust spread measure."""
    if not values:
        return 0.0
    median_val = statistics.median(values)
    deviations = [abs(v - median_val) for v in values]
    return statistics.median(deviations)


def coefficient_of_variation(values):
    """Calculate coefficient of variation (std/mean)."""
    if len(values) < 2:
        return 0.0
    mean_v = statistics.mean(values)
    if mean_v == 0:
        return 0.0
    stdev = statistics.stdev(values)
    return stdev / mean_v


def autocorrelation(values, max_lag=10):
    """Calculate autocorrelation at various lags, return max peak."""
    n = len(values)
    if n < max_lag + 2:
        return 0.0
    mean_v = statistics.mean(values)
    variance = sum((x - mean_v) ** 2 for x in values) / n
    if variance == 0:
        return 0.0

    max_corr = 0.0
    for lag in range(2, min(max_lag, n // 2)):
        if n - lag < 2:
            break
        cov = sum((values[i] - mean_v) * (values[i + lag] - mean_v)
                  for i in range(n - lag)) / (n - lag)
        corr = cov / variance
        max_corr = max(max_corr, abs(corr))
    return max_corr


class BeaconingDetector(BaseDetector):
    """Detects C2 beaconing via inter-arrival time periodicity analysis."""

    def __init__(self, config=None):
        super().__init__("beaconing")
        self.config = config or {}
        self.min_connections = self.config.get('min_connections', 4)
        self.min_observation_sec = self.config.get('min_observation_sec', 10)
        self.iat_cv_threshold = self.config.get('iat_cv_threshold', 0.5)
        self.iat_autocorr_threshold = self.config.get('iat_autocorr_threshold', 0.3)
        self.max_jitter_pct = self.config.get('max_jitter_pct', 50)

    def detect(self, flows, features):
        """Analyze flows for beaconing patterns."""
        self.alerts = []
        if not flows:
            return self.alerts

        # Group connections by (src_ip, dst_ip)
        connection_tuples = defaultdict(list)

        for flow_key, flow in flows.items():
            src_ip, dst_ip = flow_key[0], flow_key[1]
            timestamps = flow.get('timestamps', [])
            if timestamps:
                connection_tuples[(src_ip, dst_ip)].extend(timestamps)

        for (src_ip, dst_ip), timestamps in connection_tuples.items():
            if len(timestamps) < self.min_connections:
                continue

            timestamps.sort()
            observation_span = timestamps[-1] - timestamps[0]
            if observation_span < self.min_observation_sec:
                continue

            # Calculate inter-arrival times
            iats = [timestamps[i + 1] - timestamps[i] for i in range(len(timestamps) - 1)]
            if len(iats) < 3:
                continue

            # Robust statistics
            iat_mean = statistics.mean(iats)
            iat_median = statistics.median(iats)
            iat_cv = coefficient_of_variation(iats)
            iat_skew = bowley_skewness(iats)
            iat_mad = median_absolute_deviation(iats)
            iat_autocorr = autocorrelation(iats)

            # Jitter estimate from MAD/median ratio
            jitter_pct = round((iat_mad / iat_median) * 100, 2) if iat_median > 0 else 100

            # Score the beaconing likelihood
            score = 0.0

            # Low CV = regular timing
            if iat_cv < self.iat_cv_threshold:
                score += 0.3 * (1 - iat_cv / self.iat_cv_threshold)

            # High autocorrelation = periodicity
            if iat_autocorr > self.iat_autocorr_threshold:
                score += 0.3 * min(iat_autocorr / self.iat_autocorr_threshold, 1.5)

            # Low skew = machine-like symmetry
            if abs(iat_skew) < 0.3:
                score += 0.2

            # Low jitter
            if jitter_pct < self.max_jitter_pct:
                score += 0.2 * (1 - jitter_pct / self.max_jitter_pct)

            # Enough evidence weight
            if len(timestamps) > 24:
                score += 0.1

            confidence = round(min(score, 0.99), 3)

            if confidence >= 0.4:
                severity = 'critical' if confidence >= 0.75 else 'high' if confidence >= 0.6 else 'medium'
                self.alerts.append({
                    'threat_type': 'beaconing',
                    'src_ip': src_ip,
                    'dst_ip': dst_ip,
                    'interval_mean': round(iat_mean, 3),
                    'interval_variance': round(statistics.variance(iats) if len(iats) > 1 else 0, 3),
                    'jitter_pct': jitter_pct,
                    'confidence': confidence,
                    'severity': severity,
                    'evidence': {
                        'connection_count': len(timestamps),
                        'observation_span_sec': round(observation_span, 2),
                        'iat_mean_sec': round(iat_mean, 3),
                        'iat_median_sec': round(iat_median, 3),
                        'iat_cv': round(iat_cv, 4),
                        'iat_bowley_skew': round(iat_skew, 4),
                        'iat_autocorr': round(iat_autocorr, 4),
                        'iat_mad': round(iat_mad, 4)
                    }
                })

        return self.alerts

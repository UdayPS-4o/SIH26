"""DGA/DNS tunneling detector.

Detects algorithmically generated domain names and DNS tunneling activity:
- Domain name entropy (Shannon entropy)
- Unusual consonant/vowel patterns
- Unusually long domain names
- High entropy in subdomain labels
"""
import math
import re
from collections import defaultdict
from detectors.base import BaseDetector


VOWELS = set('aeiou')
CONSONANTS = set('bcdfghjklmnpqrstvwxyz')
DIGITS = set('0123456789')


def shannon_entropy(s):
    """Calculate Shannon entropy of a string."""
    if not s:
        return 0.0
    total = len(s)
    counts = {}
    for c in s.lower():
        counts[c] = counts.get(c, 0) + 1
    entropy = 0.0
    for count in counts.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)
    return entropy


def consonant_ratio(s):
    """Ratio of consonants to total alphabetic characters."""
    alpha = [c for c in s.lower() if c.isalpha()]
    if not alpha:
        return 0.0
    return sum(1 for c in alpha if c in CONSONANTS) / len(alpha)


def max_consecutive_consonants(s):
    """Maximum run of consecutive consonants."""
    max_run = 0
    current = 0
    for c in s.lower():
        if c in CONSONANTS:
            current += 1
            max_run = max(max_run, current)
        else:
            current = 0
    return max_run


def vowel_consonant_alternation_score(s):
    """Score alternation between vowels and consonants (high = more alternating)."""
    chars = [c.lower() for c in s if c.isalpha()]
    if len(chars) < 3:
        return 0.0
    alternations = sum(1 for i in range(len(chars) - 1)
                       if (chars[i] in VOWELS) != (chars[i + 1] in VOWELS))
    return alternations / (len(chars) - 1)


def is_dga_candidate(domain):
    """Check if a domain name has DGA-like characteristics."""
    if not domain:
        return False, {}

    features = {}
    features['length'] = len(domain)
    features['entropy'] = round(shannon_entropy(domain), 4)
    features['consonant_ratio'] = round(consonant_ratio(domain), 4)
    features['max_consec_consonants'] = max_consecutive_consonants(domain)
    features['vowel_consonant_alternation'] = round(vowel_consonant_alternation_score(domain), 4)
    features['digit_ratio'] = sum(1 for c in domain if c in DIGITS) / len(domain) if domain else 0
    features['is_long'] = len(domain) > 40
    features['hyphen_count'] = domain.count('-')
    features['dot_count'] = domain.count('.')

    # Scoring
    score = 0.0

    # High entropy
    if features['entropy'] > 3.5:
        score += 0.25
    if features['entropy'] > 4.0:
        score += 0.15

    # High consonant ratio (DGA domains tend to be consonant-heavy)
    if features['consonant_ratio'] > 0.7:
        score += 0.2

    # Long domains
    if features['is_long']:
        score += 0.15

    # Many consecutive consonants
    if features['max_consec_consonants'] >= 4:
        score += 0.15

    # High alternation (DGA often alternates VCVC...)
    if features['vowel_consonant_alternation'] > 0.6:
        score += 0.1

    # Unusual digit ratio
    if features['digit_ratio'] > 0.2:
        score += 0.1

    is_suspicious = score >= 0.4
    return is_suspicious, features


class DGADetector(BaseDetector):
    """Detects DGA domains and DNS tunneling activity."""

    def __init__(self, config=None):
        super().__init__("dga")
        self.config = config or {}
        self.entropy_threshold = self.config.get('entropy_threshold', 3.5)
        self.length_threshold = self.config.get('length_threshold', 40)
        self.min_queries_per_host = self.config.get('min_queries_per_host', 3)
        self.nxdomain_ratio_threshold = self.config.get('nxdomain_ratio_threshold', 0.5)

    def detect(self, flows, features):
        """Analyze DNS flows for DGA/tunneling patterns."""
        self.alerts = []
        if not flows:
            return self.alerts

        # Collect DNS queries
        dns_queries = []
        for flow_key, flow in flows.items():
            proto = flow_key[4]
            if proto in ('udp', 'tcp'):
                # Check if this looks like DNS traffic (port 53 or high port DNS)
                dst_port = str(flow_key[3])
                src_port = str(flow_key[2])
                is_dns = (dst_port == '53' or src_port == '53' or
                         flow.get('service') == 'dns')
                if is_dns or 'dns' in flow.get('app_proto', '').lower():
                    domains = flow.get('dns_queries', [])
                    for domain in domains:
                        if domain:
                            dns_queries.append({
                                'domain': domain,
                                'src_ip': flow_key[0],
                                'dst_ip': flow_key[1],
                                'timestamp': flow.get('first_seen', 0),
                                'has_response': flow.get('dns_responses', 0) > 0,
                                'is_nxdomain': flow.get('dns_nxdomain', False),
                                'ttl': flow.get('dns_ttl', 0),
                                'record_types': flow.get('dns_record_types', [])
                            })

        # Also check the features dict for DNS data
        for flow_key, feat in features.items():
            if isinstance(feat, dict) and 'dns_queries' in feat:
                for domain in feat.get('dns_queries', []):
                    if domain:
                        dns_queries.append({
                            'domain': domain,
                            'src_ip': flow_key[0],
                            'timestamp': feat.get('first_seen', 0),
                            'is_nxdomain': feat.get('dns_nxdomain', False),
                            'ttl': feat.get('dns_ttl', 0),
                        })

        if not dns_queries:
            return self.alerts

        # Group by source host
        host_queries = defaultdict(list)
        for q in dns_queries:
            host_queries[q['src_ip']].append(q)

        for src_ip, queries in host_queries.items():
            unique_domains = set(q['domain'] for q in queries)

            # Aggregate features
            total = len(queries)
            nxdomain_count = sum(1 for q in queries if q.get('is_nxdomain'))
            nxdomain_ratio = nxdomain_count / total if total > 0 else 0

            # Check per-domain characteristics
            suspicious_domains = []
            for q in queries:
                is_dga, domain_features = is_dga_candidate(q['domain'])
                if is_dga:
                    suspicious_domains.append({
                        'domain': q['domain'],
                        'features': domain_features,
                        'is_nxdomain': q.get('is_nxdomain', False),
                        'timestamp': q.get('timestamp', 0)
                    })

            # DGA alert conditions:
            # 1. High NXDOMAIN ratio from one host (aggregate signal)
            # 2. Many unique never-before-seen domains
            # 3. Per-domain DGA characteristics

            confidence = 0.0
            reasons = []

            # Aggregate signal: NXDOMAIN burst
            if nxdomain_ratio >= self.nxdomain_ratio_threshold and total >= self.min_queries_per_host:
                confidence += 0.35
                reasons.append(f"high_nxdomain_ratio_{nxdomain_ratio:.2f}")

            # Many unique domains
            unique_ratio = len(unique_domains) / total if total > 0 else 0
            if unique_ratio > 0.7 and total >= self.min_queries_per_host:
                confidence += 0.25
                reasons.append(f"high_unique_domain_ratio_{unique_ratio:.2f}")

            # Per-domain DGA features
            dga_domain_count = len(suspicious_domains)
            if dga_domain_count >= 5:
                confidence += 0.3
                reasons.append(f"suspicious_domains_{dga_domain_count}")

            # Long domains
            long_domains = [q for q in queries if len(q['domain']) > self.length_threshold]
            if len(long_domains) >= 3:
                confidence += 0.15
                reasons.append(f"long_domains_{len(long_domains)}")

            confidence = round(min(confidence, 0.99), 3)

            if confidence >= 0.35:
                severity = 'critical' if confidence >= 0.7 else 'high' if confidence >= 0.5 else 'medium'
                self.alerts.append({
                    'threat_type': 'dga',
                    'src_ip': src_ip,
                    'suspicious_domains': [d['domain'] for d in suspicious_domains[:10]],
                    'domain_count': len(unique_domains),
                    'nxdomain_ratio': round(nxdomain_ratio, 4),
                    'confidence': confidence,
                    'severity': severity,
                    'evidence': {
                        'total_queries': total,
                        'unique_domains': len(unique_domains),
                        'nxdomain_count': nxdomain_count,
                        'suspicious_domain_count': dga_domain_count,
                        'long_domain_count': len(long_domains),
                        'reasons': reasons,
                        'sample_features': suspicious_domains[0]['features'] if suspicious_domains else {}
                    }
                })

        return self.alerts

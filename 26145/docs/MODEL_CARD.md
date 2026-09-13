# Model Card: CyberThreatDetect v1.0

---

## Model Details

| Field | Value |
|---|---|
| **Model Name** | CyberThreatDetect |
| **Version** | 1.0.0 |
| **Release Date** | September 2025 |
| **Model Type** | Hybrid Ensemble (Rule-based thresholds + Supervised ML + Unsupervised Anomaly Detection) |
| **Developer** | Team 26145, Smart India Hackathon 2026 |
| **License** | Proprietary (Hackathon Submission) |
| **Framework** | scikit-learn, custom rule engine, asyncio-based pipeline |

### Components

| Component | Algorithm | Purpose |
|---|---|---|
| Rule Engine | Hand-tuned threshold checks | Fast, deterministic detection of known attack signatures |
| Classifier | Logistic Regression (multinomial, L2-regularized) | Multi-class threat type classification |
| Anomaly Detector | Isolation Forest (100 trees, contamination=0.1) | Unsupervised outlier detection for novel threats |
| Calibrator | Platt Scaling (logistic calibration) | Probability score calibration |

---

## Intended Use

### Primary Use Cases

- **Real-time threat detection** in unidirectional network traffic (SPAN port / network TAP) environments
- **SOC augmentation**: providing network security operators with prioritized, contextualized threat alerts
- **Edge deployment**: self-contained monitoring on-premises without cloud dependency
- **Government and critical infrastructure** networks where passive, non-intrusive monitoring is required

### Intended Users

- Network Security Operations Center (SOC) analysts
- Incident response teams
- Network infrastructure administrators
- Security compliance officers

### Out-of-Scope Uses

The following use cases are explicitly **out of scope** and not supported:

- **Payload inspection or content filtering**: The model operates exclusively on flow metadata (5-tuple, timing, volume, protocol headers). It does not decrypt, reassemble, or inspect application-layer payloads.
- **Active mitigation or blocking**: The system is a detection-only platform. It does not inject firewall rules, modify routing, or take any active countermeasures.
- **Encryption breaking or traffic decryption**: The system does not attempt to decrypt TLS, QUIC, or any other encrypted protocol.
- **Attribution or forensic evidence**: Alert outputs are intended for operational triage, not as admissible forensic evidence.
- **Standalone compliance tool**: The system augments but does not replace mandated security controls (e.g., SIEM, EDR, vulnerability scanners).
- **Personally identifiable information (PII) surveillance**: The system is not designed for employee monitoring, behavioral surveillance, or any non-security use of network metadata.

---

## Training Data

### Data Sources

The training dataset was generated synthetically using a combination of open-source tools and custom traffic generators:

| Source Tool | Purpose |
|---|---|
| `iperf3` | Generate benign TCP/UDP throughput patterns |
| `hping3` | Generate DDoS flood traffic (SYN, UDP, ICMP) |
| `nmap` | Generate port scanning patterns (SYN, FIN, XMAS) |
| `dnscat2` | Generate realistic DNS tunneling traffic |
| Custom Python emulator | Generate botnet C2 beaconing patterns with configurable jitter |
| Custom DGA generator | Generate domain names using dictionary, random, and Markov-chain algorithms |
| `curl` / browser automation | Generate legitimate HTTPS browsing and API call patterns |
| Custom DNS generator | Generate legitimate DNS query streams (A, AAAA, MX, TXT records) |
| Custom TLS client | Generate baseline TLS handshake patterns for JA3 fingerprint profiling |

### Dataset Statistics

| Attribute | Value |
|---|---|
| Total flow records | 2,000,000+ |
| Benign flows | 1,500,000 (75%) |
| Attack flows | 500,000 (25%) |
| Feature dimensions | 25+ per flow record |
| Label scheme | Binary (benign / attack) + Multi-class (7 threat types) |

### Attack Class Distribution

| Threat Type | Flows | % of Attack Set |
|---|---|---|
| DDoS (Volumetric/Protocol) | 125,000 | 25% |
| Botnet C2 Beaconing | 125,000 | 25% |
| DGA (Domain Generation) | 125,000 | 25% |
| DNS Tunneling | 50,000 | 10% |
| TLS/QUIC Anomaly | 25,000 | 5% |
| Port Scanning | 25,000 | 5% |
| Data Exfiltration | 25,000 | 5% |

### Data Preprocessing

- **Normalization**: All flow records mapped to canonical schema; timestamps normalized to UTC epoch milliseconds.
- **Malformed record handling**: Records with missing mandatory fields are dropped with a logged warning; processing does not block.
- **Class balancing**: Attack classes are upsampled (SMOTE for ML training) to ensure balanced representation; the rule engine is class-imbalanced by design.
- **Train/validation/test split**: Temporal split (60/20/20) with stratification by attack type to prevent data leakage.

---

## Performance

### Overall Metrics (Test Set)

| Metric | Value |
|---|---|
| Overall F1-Score | **0.92** |
| Overall Precision | 0.91 |
| Overall Recall | 0.93 |
| ROC-AUC | 0.95 |
| False Positive Rate | 3.2% |
| Inference latency (average per flow) | 45 ms |
| Inference latency (p99) | 98 ms |
| Model size (serialized) | ~12 MB |

### Per-Class Performance

| Threat Type | Precision | Recall | F1-Score | ROC-AUC | Notes |
|---|---|---|---|---|---|
| DDoS (Volumetric/Protocol) | 0.95 | 0.93 | **0.94** | 0.97 | High volume makes detection robust; occasional false positives during legitimate traffic spikes |
| Botnet C2 Beaconing | 0.91 | 0.87 | **0.89** | 0.93 | Jittered beacons reduce recall; very regular beacons detected with >95% recall |
| DGA (Domain Generation) | 0.93 | 0.89 | **0.91** | 0.95 | Strong entropy signal; short DGA domains (< 8 chars) occasionally missed |
| DNS Tunneling | 0.88 | 0.86 | **0.87** | 0.91 | Low volume in test set; higher thresholds trade recall for precision |
| TLS/QUIC Anomaly | 0.85 | 0.83 | **0.84** | 0.89 | Novel JA3 fingerprints not in profiling set reduce recall |
| Port Scanning | 0.95 | 0.91 | **0.93** | 0.96 | High fan-out ratio is distinctive; slow scans spread over time may evade |
| Data Exfiltration | 0.90 | 0.86 | **0.88** | 0.92 | Off-hours indicator improves precision; low-volume exfiltration hard to detect |

### Confusion Analysis

The most common confusion pairs on the test set:

1. **DNS Tunneling ↔ DGA**: Both involve unusual DNS query patterns. Disambiguation relies on the n-gram language model score (DGA domains score low; tunneled queries often contain recognizable subdomains).
2. **DDoS ↔ Legitimate traffic spike**: During flash crowd events (e.g., product launches, news events), legitimate traffic may breach DDoS thresholds. The baseline learning system adapts over 24 hours, but cold-start sensitivity remains.
3. **Port Scanning ↔ Service discovery**: Legitimate network inventory tools (e.g., `nmap` run by administrators) may trigger scanning rules. Integration with asset management allow-lists is recommended.

### Robustness

| Stress Condition | Result |
|---|---|
| 2x baseline throughput | F1-Score maintained at 0.90; p99 latency rises to 140 ms |
| 5% packet loss (flow metadata) | F1-Score drops to 0.87; packet_count-based features lose precision |
| Concept drift (simulated, 30-day shift) | F1-Score drops to 0.86 without retraining; 0.91 with weekly retraining |
| Adversarial jitter (+200ms to beacon IAT) | Beaconing recall drops from 87% to 71% |

---

## Ethical Considerations

### Privacy

- **Passive monitoring only**: The system captures flow metadata (IP addresses, ports, protocol types, timing, byte counts) and protocol-level headers (DNS query names, TLS JA3 hashes). It does not capture, store, or process packet payload content.
- **PII minimization**: IP addresses are retained as operational identifiers. No correlation with user identity databases is performed. If deployed in an enterprise context, IP-to-employee mapping is the responsibility of the deploying organization.
- **Data retention**: Alert records are retained for 90 days by default. Raw flow metadata is not persisted beyond the in-memory sliding window (configurable, default 60 seconds). The alert store can be configured for shorter retention periods to comply with organizational policies.
- **No external data exfiltration**: All processing, model inference, and alert storage occurs within the deployment boundary. No flow data, alerts, or model telemetry is transmitted to external services or APIs.

### Fairness and Bias

- **Network position bias**: Detection accuracy depends on the network vantage point. Edge sensors monitoring a single subnet may have different baseline distributions than core sensors monitoring aggregate traffic. Baseline profiles must be learned per-sensor to avoid systematic false positives.
- **Time-of-day bias**: Off-hours indicators may penalize legitimate night-shift operations or globally distributed teams. The off-hours window should be configured per-deployment.

### Intended Defensive Use Only

This system is designed exclusively for **defensive cybersecurity purposes**. It must not be used for:
- Unauthorized surveillance of individuals
- Network access control or filtering beyond security alerting
- Any purpose that violates applicable privacy laws or organizational policies
- Competitive intelligence gathering

Deploying organizations are responsible for ensuring compliance with local data protection regulations (e.g., GDPR, India's DPDP Act) and obtaining appropriate authorization for network monitoring.

---

## Maintenance

### Retraining Schedule

| Frequency | Activity |
|---|---|
| **Weekly** | Performance monitoring: FPR/FNR drift detection against production alert feedback |
| **Monthly** | Full model retraining with accumulated labeled data (confirmed true positives + false positives) |
| **Quarterly** | Architecture review: evaluate new feature contributions, deprecate low-value features |
| **Annually** | Comprehensive threat model review, addition of new threat type modules if needed |

### Monitoring

- **Drift detection**: Track per-class precision and recall weekly. Alert if FPR exceeds 5% or recall for any class drops below 75%.
- **Alert volume tracking**: Monitor alert rate per hour; a sudden spike may indicate concept drift or a genuine campaign.
- **Model versioning**: All trained models are versioned with git. Rollback to the previous production model is supported within 5 minutes.

### Update Process

1. New attack patterns identified (from threat feeds, analyst feedback, red-teaming) are documented in the issue tracker.
2. Feature engineering is updated to capture distinguishing characteristics.
3. Synthetic attack traffic is generated for the new pattern.
4. Model is retrained and validated on an augmented dataset.
5. Shadow testing runs the new model alongside production for 7 days before promotion.
6. Production promotion requires sign-off from at least one security domain reviewer.

### Known Issues

| Issue | Severity | Status |
|---|---|---|
| Cold-start baseline absence causes elevated FPR in first 24h | Medium | Mitigated by conservative default thresholds; logged |
| Jittered beaconing (>200ms IAT variation) reduces recall | Low | Tracked; future work on adaptive jitter modeling |
| Slow port scans (1 port/hour) evade detection | Low | Accepted trade-off; very slow scans flagged as informational |
| DNS tunneling detection degrades with fragmented DNS messages | Low | Edge case; requires TCP DNS stream reassembly |

---

## Contact and Feedback

For questions, bug reports, or contributions related to this model:

- **Project Repository**: `https://github.com/team26145/sih26-cyber-threat-detection`
- **Issue Tracker**: GitHub Issues with label `model-card`
- **Security disclosures**: Report via private email to the team lead (see hackathon submission)

---

*Model Card Version: 1.0*
*Last Updated: September 2025*
*Corresponding Paper: See `TECHNICAL_REPORT.md` Section 3 for detailed algorithm descriptions.*

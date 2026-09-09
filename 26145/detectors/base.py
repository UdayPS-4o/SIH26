"""Base detector class for EKADHARA threat detection."""


class BaseDetector:
    """Abstract base class for all threat detectors."""

    def __init__(self, name):
        self.name = name
        self.alerts = []

    def detect(self, flows, features):
        """Analyze flows and features, return list of alerts."""
        raise NotImplementedError

    def get_alerts(self):
        """Return accumulated alerts."""
        return self.alerts

    def clear_alerts(self):
        """Reset alert buffer."""
        self.alerts = []

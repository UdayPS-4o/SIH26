"""
VIMAAN — licensed API connectors.
Amadeus (OAuth2) and Duffel (Bearer token) require contractual agreements.
DGCA feed arrives twice-daily via SFTP under an MoU.
"""

import httpx
from datetime import datetime, timezone

try:
    from collectors.base import BaseCollector, FareQuote, CollectorKind  # type: ignore
except ImportError:
    pass


class AmadeusCollector(BaseCollector):
    name = "Amadeus"
    kind = CollectorKind.API
    base_url = "https://test.api.amadeus.com"
    crawl_delay_s = 1.0
    nightly_cap = 200

    def __init__(self, compliance, client_id: str = "", client_secret: str = ""):
        super().__init__(compliance)
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token = ""

    def _get_token(self, session: httpx.Client) -> str:
        resp = session.post(
            f"{self.base_url}/v1/security/oauth2/token",
            data={"grant_type": "client_credentials", "client_id": self.client_id, "client_secret": self.client_secret},
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def _fetch(self, session: httpx.Client, sector: str, lead_days: int) -> list:
        if not self._access_token:
            self._access_token = self._get_token(session)
        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        resp = session.get(
            f"{self.base_url}/v2/shopping/flight-offers",
            params={"originLocationCode": origin, "destinationLocationCode": dest,
                    "departureDate": dep, "adults": 1, "currencyCode": "INR"},
            headers={"Authorization": f"Bearer {self._access_token}"},
        )
        quotes = []
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            for offer in data[:4]:
                price = float(offer["price"]["total"])
                carrier = offer["validatingAirlineCodes"][0]
                quotes.append(FareQuote(
                    source="Amadeus", sector=sector, carrier=carrier,
                    departure_date=dep, lead_days=lead_days, cabin="Economy",
                    base_fare=round(price / 1.12, 2), taxes=round(price * 0.09, 2),
                    udf=186.0, convenience_fee=0, total_fare=price,
                ))
        return quotes


class DuffelCollector(BaseCollector):
    name = "Duffel"
    kind = CollectorKind.API
    base_url = "https://api.duffel.com"
    crawl_delay_s = 1.0
    nightly_cap = 200

    def __init__(self, compliance, access_token: str = ""):
        super().__init__(compliance)
        self.access_token = access_token

    def _fetch(self, session: httpx.Client, sector: str, lead_days: int) -> list:
        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        resp = session.get(
            f"{self.base_url}/air/offer_requests",
            params={"origin": origin, "destination": dest,
                    "departure_date": dep, "cabin_class": "economy"},
            headers={"Authorization": f"Bearer {self.access_token}"},
        )
        quotes = []
        if resp.status_code in (200, 201):
            for offer in resp.json().get("data", {}).get("offers", [])[:4]:
                price = float(offer["total_amount"])
                carrier = offer.get("owner", {}).get("name", "?")
                quotes.append(FareQuote(
                    source="Duffel", sector=sector, carrier=carrier,
                    departure_date=dep, lead_days=lead_days, cabin="Economy",
                    base_fare=round(price / 1.12, 2), taxes=round(price * 0.09, 2),
                    udf=186.0, convenience_fee=0, total_fare=price,
                ))
        return quotes


class DGCAFeedCollector(BaseCollector):
    name = "DGCA Feed"
    kind = CollectorKind.FEED
    base_url = "sftp://data.mospi.gov.in/dgca/tariff"
    crawl_delay_s = 0.5
    nightly_cap = 150

    def _fetch(self, session, sector: str, lead_days: int) -> list:
        # In production: paramiko SFTP download, CSV parse.
        return [FareQuote(
            source="DGCA Feed", sector=sector, carrier="REF",
            departure_date=datetime.now(timezone.utc).date().isoformat(),
            lead_days=lead_days, cabin="Economy",
            base_fare=4500.0, taxes=850.0, udf=186.0,
            convenience_fee=0, total_fare=5536.0,
        )]

"""Generate Common National Material Codes (CNMC) for materials."""

import hashlib
import re
from app.services.normalizer import DescriptionNormalizer

class CNMCGenerator:
    SEGMENT_CODES = {
        "fasteners": "FA",
        "pipes_tubes": "PT",
        "valves_fittings": "VF",
        "hydraulics_lubricants": "HL",
        "bearings": "BE",
        "electrical": "EL",
        "instruments": "IN",
        "structural_steel": "SS",
        "welding": "WE",
        "safety_ppe": "SP",
        "pumps_comp": "PC",
        "chemicals": "CH",
        "packaging": "PK",
        "miscellaneous": "MX",
    }

    def __init__(self):
        self.normalizer = DescriptionNormalizer()
        self.classifier = None  # Will be used for family classification

    def generate_code(self, material) -> str:
        segment = self.SEGMENT_CODES.get(material.family, "MX")
        desc_hash = hashlib.md5((material.description or "").encode()).hexdigest()[:6].upper()
        return f"CNMC-{segment}-{desc_hash}"

    def suggest_classification(self, description: str, family: str = None) -> dict:
        from app.services.classifier import MaterialClassifier
        if self.classifier is None:
            self.classifier = MaterialClassifier()
        normalized = self.normalizer.normalize(description)
        attrs = self.normalizer.extract_numeric_attributes(description)
        family_label = self.classifier.classify(description, family)
        return {
            "suggested_family": family_label,
            "normalized_description": normalized,
            "extracted_attributes": attrs,
            "suggested_uom": self._suggest_uom(description),
        }

    def _suggest_uom(self, description: str) -> str:
        text = description.lower()
        if any(k in text for k in ["liter", "ltr", "oil", "grease", "drum"]): return "LTR"
        if any(k in text for k in ["meter", "mtr", "pipe", "tube", "cable"]): return "MTR"
        if any(k in text for k in ["kg", "kilogram", "weight"]): return "KG"
        if any(k in text for k in ["roll", "sheet"]): return "ROLL"
        if any(k in text for k in ["bolt", "nut", "bearing", "valve", "pump"]): return "NOS"
        return "NOS"

    def batch_generate(self, materials) -> list:
        results = []
        existing = {}
        for mat in materials:
            raw = self.generate_code(mat)
            if raw in existing:
                raw = self._make_unique(raw)
            existing[raw] = True
            results.append({"material_id": mat.id, "suggested_cnmc": raw, "method": "hash"})
        return results

    def _make_unique(self, code: str) -> str:
        return f"{code}-{hashlib.md5(code.encode()).hexdigest()[:4].upper()}"

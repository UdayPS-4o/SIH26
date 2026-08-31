"""Material classifier - assigns family/category to materials."""

import re
from app.services.normalizer import DescriptionNormalizer

CLASSIFICATION_KEYWORDS = {
    "fasteners": ["bolt", "nut", "screw", "washer", "stud", "rivet", "pin", "fastener", "hex head", "socket head"],
    "pipes_tubes": ["pipe", "tube", "seamless", "erw", "sch40", "sch80", "is1239", "is3589", "conduit"],
    "valves_fittings": ["valve", "flange", "elbow", "tee", "reducer", "cap", "union", "coupling", "gasket", "fitting"],
    "hydraulics_lubricants": ["oil", "grease", "hydraulic", "lubricant", "turbine oil", "gear oil", "compressor oil", "vg46", "vg68"],
    "bearings": ["bearing", "ball bearing", "roller bearing", "thrust bearing", "bush"],
    "electrical": ["cable", "wire", "switch", "circuit breaker", "mcb", "mccb", "contactor", "motor", "transformer", "starter", "fuse", "lamp", "led", "panel", "cable gland"],
    "instruments": ["gauge", "transmitter", "thermometer", "switch", "controller", "indicator", "analyzer", "flow meter", "level", "pressure", "temperature"],
    "structural_steel": ["angle", "channel", "beam", "plate", "sheet", "bar", "rod", "ms flat", "hr plate", "cr plate", "structural"],
    "welding": ["electrode", "welding wire", "rod", "flux", "torch", "welding"],
    "safety_ppe": ["helmet", "glove", "goggle", "mask", "safety", "boot", "suit", "harness", "respirator"],
    "pumps_comp": ["pump", "compressor", "blower", "fan", "turbine", "motor"],
    "chemicals": ["acid", "caustic", "solvent", "chemical", "reactant", "catalyst", "cleaning agent"],
    "packaging": ["drum", "barrel", "bag", "pail", "can", "container"],
    "miscellaneous": ["misc", "general", "other", "miscellaneous"],
}

class MaterialClassifier:
    def __init__(self):
        self.normalizer = DescriptionNormalizer()

    def classify(self, description: str, family: str = None) -> str:
        text = description.lower()
        scores = {}
        for family_name, keywords in CLASSIFICATION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            scores[family_name] = score
        best = max(scores, key=scores.get)
        if scores[best] > 0:
            return best
        return "miscellaneous"

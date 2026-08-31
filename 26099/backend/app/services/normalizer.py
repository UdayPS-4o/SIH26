"""Material description normalizer."""

import re
from typing import Optional


class DescriptionNormalizer:
    """Normalize material descriptions for consistent matching."""

    COMMON_STOP_WORDS = {
        'the', 'a', 'an', 'of', 'and', 'or', 'for', 'with', 'to', 'in', 'mm', 'kg', 'nos',
        'nos.', 'no', 'no.', 'dia', 'dia.', 'sch', 'sch.', 'type', 'size', 'length',
    }

    GRADE_NORMALIZATIONS = {
        '304ss': '304 ss', '304lss': '304l ss', '316ss': '316 ss', '316lss': '316l ss',
        'ms': 'ms', 'mild steel': 'ms', 'carbon steel': 'cs', 'cs': 'cs',
        'ss304': 'ss304', 'ss316': 'ss316', 'ss': 'ss',
        'gr8.8': '8.8', 'gr10.9': '10.9', 'gr12.9': '12.9',
        'a2-70': 'a2-70', 'a4-80': 'a4-80',
        'is:1239': 'is1239', 'is1364': 'is1364', 'is1363': 'is1363',
    }

    SPEC_NORMALIZATIONS = {
        'seamless': 'smls', 'smls': 'smls',
        'erw': 'erw', 'electric resistance welded': 'erw',
        'sch40': 'sch40', 'schedule 40': 'sch40', 'sch.40': 'sch40',
        'sch80': 'sch80', 'schedule 80': 'sch80', 'sch.80': 'sch80',
        'pn16': 'pn16', 'pn 16': 'pn16',
        'pn40': 'pn40', 'pn 40': 'pn40',
        'hex head': 'hex', 'socket head': 'shcs',
        'full thread': 'ft', 'partial thread': 'pt',
    }

    def normalize(self, text: str) -> str:
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.split()
        tokens = [t for t in tokens if t not in self.COMMON_STOP_WORDS and len(t) > 1]
        for i, token in enumerate(tokens):
            if token in self.GRADE_NORMALIZATIONS:
                tokens[i] = self.GRADE_NORMALIZATIONS[token]
            elif token in self.SPEC_NORMALIZATIONS:
                tokens[i] = self.SPEC_NORMALIZATIONS[token]
        return ' '.join(tokens)

    def normalize_grade(self, grade: Optional[str]) -> str:
        if not grade:
            return ""
        g = grade.lower().strip()
        return self.GRADE_NORMALIZATIONS.get(g, g)

    def normalize_dimensions(self, dimensions: Optional[str]) -> str:
        if not dimensions:
            return ""
        d = dimensions.upper()
        d = re.sub(r'\s*[xX×]\s*', 'x', d)
        return d.strip()

    def extract_numeric_attributes(self, text: str) -> dict:
        attrs: dict = {}
        dim_match = re.search(r'(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)', text)
        if dim_match:
            attrs['dim_primary'] = float(dim_match.group(1))
            attrs['dim_secondary'] = float(dim_match.group(2))
        size_match = re.search(r'M\s*(\d+)', text)
        if size_match:
            attrs['thread_size'] = float(size_match.group(1))
        grade_match = re.search(r'(A2-70|A4-80|8\.8|10\.9|12\.9|304L?|316L?)', text, re.IGNORECASE)
        if grade_match:
            attrs['grade'] = grade_match.group(1).upper()
        pressure_match = re.search(r'PN\s*(\d+)', text, re.IGNORECASE)
        if pressure_match:
            attrs['pressure_rating'] = float(pressure_match.group(1))
        return attrs

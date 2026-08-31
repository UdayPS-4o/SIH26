"""Generate demo data for SIH demonstration."""

from app.database import SessionLocal
from app.models.material import Material, CPSEOrganization

MATERIALS = [
    "Hex Bolt M10x50 Grade 8.8 Zinc Plated",
    "Carbon Steel Pipe SCH40 100NBx6M IS:1239",
    "Gate Valve DN150 PN16 Flanged Body",
    "Hydraulic Oil ISO VG 46 200L Drum",
    "Deep Groove Ball Bearing 6205-2RS",
    "XLPE Power Cable 3Cx70 Sqmm",
    "Pressure Gauge 0-10 Bar 100mm Dial SS",
    "MS Angle 50x50x6mm 6M",
    "ERW Electrode E6013 3.15mm",
    "Safety Helmet White ISI Marked",
    "Centrifugal Pump 10HP SS316",
    "Lithium Grease EP2 180kg Drum",
    "GI Sheet 22SWG 1x2M",
    "PVC Pipe 25NBx3M",
    "Thermowell Assembly SS304",
    "Anchor Bolt M24x500 Hot Dip Galvanized",
    "Copper Tube 15NBx5M Soft Annealed",
    "Butterfly Valve DN200 Wafer Type PN40",
    "Brass Cable Gland PG29 IP68",
    "Spiral Wound Gasket 150NB 300#",
    "Socket Weld Elbow 90 Deg 50NB Sch80",
    "Expansion Bolt M16x100",
    "Stainless Steel Flat Bar 20x3mm",
    "Transformer Oil Inhibited Grade-II 180L",
    "MCB 32A SP 10kA C-Curve",
    "Level Transmitter 0-5m Guided Wave Radar",
    "Carbon Steel Flange WN 100NB Sch40",
    "Hex Nut M20 Grade 8 SS304",
    "Pilot Valve 1/4 Inch Solenoid",
    "Mild Steel Pipe 50NBx6M ERW IS:3589",
    "Socket Weld Reducer 80x50NB",
    "Helical Gear Module 2 Teeth 40",
    "Industrial Fan 1500mm Axial Type",
    "Respirator Mask N95 with Valve",
    "Industrial Safety Shoes Steel Toe",
    "Quicklime Grade-A 50kg Bag",
    "Carbon Black Feedstock N330",
    "LDPE Drum 200L Natural Color",
    "Diaphragm Valve DN80 PVDF Lined",
    "Contact Block 1NO+1NC for MCCB",
]

FAMILIES = ["fasteners", "pipes_tubes", "valves_fittings", "hydraulics_lubricants", "bearings",
            "electrical", "instruments", "structural_steel", "welding", "safety_ppe",
            "pumps_comp", "chemicals", "packaging", "pumps_comp"]


def seed_demo_data(db) -> dict:
    orgs_data = [
        {"name": "Indian Oil Corporation Ltd", "short_code": "IOCL", "sector": "Oil & Gas"},
        {"name": "NTPC Ltd", "short_code": "NTPC", "sector": "Power"},
        {"name": "Steel Authority of India", "short_code": "SAIL", "sector": "Steel"},
        {"name": "Coal India Ltd", "short_code": "CIL", "sector": "Mining"},
        {"name": "Heavy Engineering Corporation", "short_code": "HEC", "sector": "Heavy Engineering"},
    ]

    orgs = []
    for o in orgs_data:
        existing = db.query(CPSEOrganization).filter(CPSEOrganization.short_code == o["short_code"]).first()
        if existing:
            orgs.append(existing)
        else:
            org = CPSEOrganization(**o)
            db.add(org)
            db.flush()
            orgs.append(org)

    created = 0
    for i, desc in enumerate(MATERIALS):
        org = orgs[i % len(orgs)]
        m = Material(
            cpse_organization_id=org.id,
            cpse_material_code=f"{org.short_code}-MAT-{i + 1:04d}",
            description=desc,
            family=FAMILIES[i % len(FAMILIES)],
            unit_of_measure="NOS" if "bolt" in desc.lower() or "valve" in desc.lower() else "MTR",
            grade="8.8" if "Grade 8" in desc else "304SS" if "304" in desc else "PN16" if "PN16" in desc else "EP2",
        )
        db.add(m)
        created += 1

    db.commit()
    return {"materials_created": created, "organizations": len(orgs), "families": list(set(FAMILIES))}

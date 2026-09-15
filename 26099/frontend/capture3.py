import os, time, json
from playwright.sync_api import sync_playwright

PORT = 5174
BASE_URL = f"http://localhost:{PORT}"
REVIEW_DIR = r"C:\Users\udayp\Documents\code\SIH26\26099\frontend\review"

# Clear old files
for f in os.listdir(REVIEW_DIR):
    fp = os.path.join(REVIEW_DIR, f)
    if os.path.isfile(fp):
        os.remove(fp)

os.makedirs(REVIEW_DIR, exist_ok=True)

SECTIONS = [
    ("/", "Dashboard"),
    ("/overview", "Overview"),
    ("/explorer", "Explorer"),
    ("/matching", "Matching"),
    ("/duplicates", "Duplicates"),
    ("/savings", "Savings"),
    ("/registry", "Registry"),
    ("/migration", "Migration"),
    ("/integration", "Integration"),
    ("/import", "Import"),
    ("/normalize", "Normalize"),
    ("/activity", "Activity"),
    ("/engine", "Engine"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    for path, label in SECTIONS:
        try:
            print(f"\n=== {label} ({path}) ===")
            page.goto(f"{BASE_URL}{path}", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout

            safe = path.replace("/", "_").strip("_") or "home"
            out = os.path.join(REVIEW_DIR, f"{safe}.png")
            page.screenshot(path=out, full_page=False)
            print(f"  Saved: {out}")

            # Get all text
            body = page.inner_text("body")
            print(f"  Text length: {len(body)}")
            print(f"  Preview: {body[:200]}")
        except Exception as e:
            print(f"  FAILED: {e}")

    browser.close()

print("\nAll screenshots captured!")

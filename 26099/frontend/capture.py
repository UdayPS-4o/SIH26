import os, re
from playwright.sync_api import sync_playwright

PORT = 5174
BASE_URL = f"http://localhost:{PORT}"
REVIEW_DIR = r"C:\Users\udayp\Documents\code\SIH26\26099\frontend\review"

PAGES = [
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

os.makedirs(REVIEW_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout

    for path, label in PAGES:
        try:
            print(f"\n=== {label} ({path}) ===")
            page.goto(f"{BASE_URL}{path}", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout

            safe = path.replace("/", "_").strip("_") or "home"
            out = os.path.join(REVIEW_DIR, f"{safe}_1.png")
            page.screenshot(path=out, full_page=False)
            print(f"Screenshot saved: {out}")

            body_text = page.inner_text("body")
            print(f"Page text preview: {body_text[:400]}")
        except Exception as e:
            print(f"FAILED {label}: {e}")

    browser.close()

print("\nDone!")

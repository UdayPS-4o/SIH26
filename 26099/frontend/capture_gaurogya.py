import os, time
from playwright.sync_api import sync_playwright

PORT = 5173
BASE_URL = f"http://localhost:{PORT}"
REVIEW_DIR = r"C:\Users\udayp\Documents\code\SIH26\26099\frontend\review"

# Clear old files
for f in os.listdir(REVIEW_DIR):
    fp = os.path.join(REVIEW_DIR, f)
    if os.path.isfile(fp):
        os.remove(fp)

os.makedirs(REVIEW_DIR, exist_ok=True)

# Sidebar nav links in order
NAV_LINKS = [
    ("/dashboard", "01-dashboard"),
    ("/animals", "02-animals"),
    ("/alerts", "03-alerts"),
    ("/herd", "04-herd-intelligence"),
    ("/milk-quality", "05-milk-quality"),
    ("/environment", "06-environment"),
    ("/worker-hygiene", "07-worker-hygiene"),
    ("/devices", "08-iot-devices"),
    ("/model", "09-model-benchmarks"),
    ("/simulator", "10-ai-simulator"),
    ("/reports", "11-reports"),
    ("/settings", "12-settings"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    for path, filename in NAV_LINKS:
        try:
            print(f"\n=== {path} -> {filename} ===")
            page.goto(f"{BASE_URL}{path}", wait_until="networkidle", timeout=30000)
            time.sleep(2)

            out = os.path.join(REVIEW_DIR, f"{filename}.png")
            page.screenshot(path=out, full_page=False)
            print(f"  Saved: {out}")

            # Get text content for documentation
            body = page.inner_text("body")
            print(f"  Text length: {len(body)}")
            print(f"  Preview: {body[:200]}")
        except Exception as e:
            print(f"  FAILED: {e}")

    # Also capture animal details page
    try:
        print("\n=== Animal Details ===")
        page.goto(f"{BASE_URL}/animals", wait_until="networkidle", timeout=30000)
        time.sleep(1)
        # Click first animal link
        page.locator('a[href*="/animals/"]').first.click()
        time.sleep(2)
        out = os.path.join(REVIEW_DIR, "13-animal-details.png")
        page.screenshot(path=out, full_page=False)
        print(f"  Saved: {out}")
    except Exception as e:
        print(f"  FAILED: {e}")

    browser.close()

print("\nAll screenshots captured!")

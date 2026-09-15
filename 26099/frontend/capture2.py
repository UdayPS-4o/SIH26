import os, time, json
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
    page.goto(f"{BASE_URL}/", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout

    results = {}

    for path, label in PAGES:
        try:
            print(f"\n=== {label} ({path}) ===")
            page.goto(f"{BASE_URL}{path}", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout

            safe = path.replace("/", "_").strip("_") or "home"
            out = os.path.join(REVIEW_DIR, f"{safe}.png")
            page.screenshot(path=out, full_page=False)
            print(f"  Screenshot: {out}")

            body_text = page.inner_text("main, [role=main], .main, main")
            # Get sidebar links to identify nav items visible
            sidebar = page.inner_text("aside, nav, .sidebar, [role=navigation]")

            # Get interactive elements
            buttons = page.eval_on_selector_all("button, [role=button]", "els => els.map(e => e.textContent?.trim()).filter(Boolean).slice(0,30)")
            links = page.eval_on_selector_all("a", "els => els.map(e => ({text: e.textContent?.trim().slice(0,60), href: e.getAttribute('href')})).filter(e => e.href).slice(0,30)")
            inputs = page.eval_on_selector_all("input, select, textarea", "els => els.map(e => ({tag: e.tagName, type: e.getAttribute('type'), placeholder: e.getAttribute('placeholder')})).slice(0,20)")

            results[label] = {
                "path": path,
                "body_text": body_text[:2000],
                "sidebar": sidebar[:500] if sidebar else "",
                "buttons": buttons,
                "links": links,
                "inputs": inputs,
            }
            print(f"  Text preview: {body_text[:300]}")
        except Exception as e:
            print(f"  FAILED: {e}")

    with open(os.path.join(REVIEW_DIR, "_page_data.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    browser.close()

print("\nDone!")

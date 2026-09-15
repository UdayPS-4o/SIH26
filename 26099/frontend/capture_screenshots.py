import asyncio
import os
from playwright.async_api import async_playwright

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

async def capture(p):
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page(viewport={"width": 1440, "height": 900})
    await page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(500)

    for path, label in PAGES:
        try:
            url = f"{BASE_URL}{path}"
            print(f"Capturing: {label} -> {url}")
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(500)

            safe = path.replace("/", "_").strip("_") or "home"
            screenshot_path = os.path.join(REVIEW_DIR, f"{safe}_1.png")
            await page.screenshot(path=screenshot_path, full_page=False)
            print(f"  Saved: {screenshot_path}")
        except Exception as e:
            print(f"  FAILED: {label} -> {e}")

    await browser.close()

async def main():
    os.makedirs(REVIEW_DIR, exist_ok=True)
    async with async_playwright() as p:
        await capture(p)

asyncio.run(main())
print("All screenshots captured!")


import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 390, 'height': 844}) # iPhone 12/13
        try:
            await page.goto("http://localhost:8081", timeout=60000)
            # Wait for content to load (e.g., banner)
            await page.wait_for_selector('text=Saldo disponible', timeout=10000)
            await page.screenshot(path="final_verification.png")
            print("Screenshot saved to final_verification.png")
        except Exception as e:
            print(f"Error: {e}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

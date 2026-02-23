from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:8081")
            page.goto("http://localhost:8081", timeout=60000)

            # Wait for key elements
            print("Waiting for content...")
            page.wait_for_selector("text=Tiendas en Liquidación", timeout=60000)

            # Take screenshot of top
            print("Taking screenshot 1...")
            page.screenshot(path="verification_home_top.png")

            # Scroll down to find the vertical list (Restaurants)
            # The vertical list is below the trending/rewards sections.
            # I'll scroll by 800 pixels.
            print("Scrolling down...")
            page.mouse.wheel(0, 800)
            time.sleep(2) # Wait for animation/render

            # Take screenshot of list
            print("Taking screenshot 2...")
            page.screenshot(path="verification_home_scroll.png")
            print("Screenshots saved.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error_scroll.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()

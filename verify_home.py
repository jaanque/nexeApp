from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:8081")
            page.goto("http://localhost:8081", timeout=60000)
            # Wait for content to load
            print("Waiting for content (10s)...")
            time.sleep(10)

            # Take screenshot
            output_path = "home_scroll_3.png"
            page.screenshot(path=output_path)
            print(f"Screenshot saved to {output_path}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()

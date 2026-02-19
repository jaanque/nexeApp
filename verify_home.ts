import { chromium } from 'playwright';

async function verifyHome() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    // Navigate to local server
    await page.goto('http://localhost:8081');

    // Wait for content to load (or skeleton to disappear)
    // The skeleton might be there for a while if network fails
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'home_verification.png' });
    console.log('Screenshot taken at home_verification.png');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

verifyHome();

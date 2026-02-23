import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the local server
  try {
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });

    // Wait for the main content to load
    await page.waitForSelector('text=Liquidación Total', { timeout: 10000 });

    // Take a screenshot of the top
    await page.screenshot({ path: 'verification_home.png' });
    console.log('Top screenshot captured.');

    // Scroll down to see the list of stores
    // "Últimas unidades" is the trending section. The list is below that.
    // We scroll enough to bypass the banner (approx 200px) and categories (approx 100px) and trending (approx 200px).
    await page.evaluate(() => window.scrollBy(0, 800));

    // Wait a bit for lazy loading / animation
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'verification_home_list.png' });
    console.log('List screenshot captured.');

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await browser.close();
  }
}

verify();

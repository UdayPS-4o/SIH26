import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Start the dev server
  const server = spawn('npx', ['vite', '--port', '5199'], {
    cwd: path.join(__dirname, 'frontend'),
    shell: true,
    stdio: 'pipe',
  });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 5000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const pages = [
    { path: '/', name: 'dashboard', scroll: true },
    { path: '/live-threats', name: 'live-threats', scroll: true },
    { path: '/network-map', name: 'network-map', scroll: true },
    { path: '/analytics', name: 'analytics', scroll: true },
    { path: '/ai-analyzer', name: 'ai-analyzer', scroll: true },
    { path: '/attack', name: 'attack', scroll: true },
    { path: '/diode-lab', name: 'diode-lab', scroll: true },
  ];

  const reviewDir = path.join(__dirname, 'review');
  const lightDir = path.join(reviewDir, 'light');
  const darkDir = path.join(reviewDir, 'dark');

  for (const p of pages) {
    // Dark mode
    await page.goto(`http://localhost:5199${p.path}`);
    await new Promise(r => setTimeout(r, 2000));

    if (p.scroll) {
      // Scroll to show full page content
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await page.screenshot({
      path: path.join(darkDir, `${p.name}.png`),
      fullPage: true,
    });
    console.log(`Captured dark: ${p.name}`);

    // Light mode
    await page.goto(`http://localhost:5199${p.path}`);
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
      // Click theme toggle
      const toggle = document.querySelector('[title*="light"], [aria-label*="light"], button[title="Switch to light mode"]');
      if (toggle) toggle.click();
      else {
        // Try to find theme button
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.includes('light') || btn.title?.includes('light')) {
            btn.click();
            break;
          }
        }
      }
    });
    await new Promise(r => setTimeout(r, 500));

    if (p.scroll) {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await page.screenshot({
      path: path.join(lightDir, `${p.name}.png`),
      fullPage: true,
    });
    console.log(`Captured light: ${p.name}`);
  }

  await browser.close();
  server.kill();
  console.log('All screenshots captured!');
}

main().catch(console.error);

import { chromium } from 'playwright-core';

export default async function handler(req, res) {
  // CORS (optional)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const {
    url,
    selector = '#ornstd-page1', // change per page
    wait = 1500,                 // extra settle time
    scale = 3                    // render density (2–4 is typical)
  } = params;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url' });
  }
  if (!process.env.BROWSERLESS_TOKEN) {
    return res.status(500).json({ error: 'Missing BROWSERLESS_TOKEN' });
  }

  let browser;
  try {
    // Connect to Browserless hosted Chrome
    browser = await chromium.connect({
      wsEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
    });

    // Fixed viewport to your div size, higher deviceScaleFactor for sharper output
    const context = await browser.newContext({
      viewport: { width: 630, height: 810, deviceScaleFactor: parseInt(scale, 10) },
      // optional: userAgent, locale, etc.
    });

    const page = await context.newPage();

    // Load your page and wait for network to quiet
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(parseInt(wait, 10));

    // Inject print + isolation CSS
    await page.addStyleTag({
      content: `
        /* Hide UI you don't want in print */
        .pdf-export-ui { display:none !important; }

        /* Isolate target element for print (keeps layout pixel-consistent) */
        body * { visibility: hidden !important; }
        ${selector}, ${selector} * { visibility: visible !important; }

        /* Force exact bleed-size page and zero margins */
        @page { size: 8.75in 11.25in; margin: 0; }
        html, body { margin:0!important; padding:0!important; background:#fff!important; }

        /* Ensure target element starts at (0,0) for full-page capture */
        html, body { width: 8.75in; height: 11.25in; }
        ${selector} {
          position: fixed !important; /* top-left corner */
          top: 0 !important;
          left: 0 !important;
          width: 630px !important;
          height: 810px !important;
          box-shadow: none !important;
          transform: none !important;
        }
      `
    });

    // Generate PDF — respect @page size & backgrounds
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // uses @page { size: ... }
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="export.pdf"');
    return res.send(pdfBuffer);

  } catch (err) {
    if (browser) try { await browser.close(); } catch {}
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

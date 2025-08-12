const { chromium } = require('playwright-aws-lambda');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!req.query.url) {
    return res.json({ 
      status: 'Playwright Screenshot API Ready',
      usage: '/api/screenshot?url=YOUR_URL&selector=ELEMENT_SELECTOR&scale=4'
    });
  }

  const { url, selector, width = 630, height = 810, scale = 4 } = req.query;
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: {
        width: parseInt(width),
        height: parseInt(height),
        deviceScaleFactor: parseInt(scale)
      }
    });
    
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    await page.addStyleTag({
      content: '.pdf-export-ui { display: none !important; }'
    });
    
    const element = await page.locator(selector);
    if (await element.count() === 0) {
      throw new Error(`Element ${selector} not found`);
    }
    
    const screenshot = await element.screenshot({ type: 'png' });
    await browser.close();
    
    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

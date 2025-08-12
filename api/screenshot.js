const playwright = require('playwright-aws-lambda');

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
      status: 'Playwright Screenshot API Ready - Fixed',
      usage: '/api/screenshot?url=YOUR_URL&selector=ELEMENT_SELECTOR&scale=4',
      playwright: playwright ? 'Available' : 'Not Available'
    });
  }

  const { url, selector, width = 630, height = 810, scale = 4 } = req.query;
  
  console.log(`📸 Playwright capturing: ${selector} from ${url} at ${scale}x scale`);
  
  try {
    const browser = await playwright.launchChromium({
      headless: true
    });
    
    const page = await browser.newPage({
      viewport: {
        width: parseInt(width),
        height: parseInt(height),
        deviceScaleFactor: parseInt(scale)
      }
    });
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(6000);
    
    await page.addStyleTag({
      content: `
        .pdf-export-ui, .pdf-export-ui * { 
          display: none !important; 
          visibility: hidden !important; 
        }
      `
    });
    
    const element = await page.locator(selector);
    const elementCount = await element.count();
    
    if (elementCount === 0) {
      throw new Error(`Element ${selector} not found on page`);
    }
    
    const screenshot = await element.screenshot({ 
      type: 'png',
      omitBackground: false 
    });
    
    await browser.close();
    
    console.log(`✅ Playwright screenshot captured: ${screenshot.length} bytes`);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="screenshot.png"');
    res.send(screenshot);
    
  } catch (error) {
    console.error('❌ Playwright screenshot failed:', error);
    res.status(500).json({ 
      error: error.message,
      service: 'playwright-screenshot-api',
      selector: selector,
      url: url
    });
  }
}

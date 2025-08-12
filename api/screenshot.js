import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, selector, width = 630, height = 810, scale = 4 } = req.query;
  
  if (!url || !selector) {
    return res.status(400).json({ 
      error: 'Missing required parameters: url and selector',
      usage: '/api/screenshot?url=YOUR_URL&selector=ELEMENT_SELECTOR'
    });
  }
  
  console.log(`📸 Capturing: ${selector} from ${url} at ${scale}x scale`);
  
  try {
    // Configure Chromium for Vercel
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    
    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height),
      deviceScaleFactor: parseInt(scale)
    });
    
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Wait for fonts and layout
    await page.waitForTimeout(8000);
    
    // Hide export buttons
    await page.addStyleTag({
      content: `
        .pdf-export-ui, .pdf-export-ui * { 
          display: none !important; 
          visibility: hidden !important; 
        }
      `
    });
    
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element ${selector} not found`);
    }
    
    const screenshot = await element.screenshot({
      type: 'png',
      omitBackground: false
    });
    
    await browser.close();
    
    console.log(`✅ Screenshot captured: ${screenshot.length} bytes`);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="screenshot.png"');
    res.send(screenshot);
    
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
    res.status(500).json({ 
      error: error.message,
      selector: selector,
      url: url,
      debug: 'Puppeteer error in Vercel serverless function'
    });
  }
}

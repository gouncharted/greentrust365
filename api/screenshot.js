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

  // For testing - return simple response
  if (!req.query.url) {
    return res.json({ 
      status: 'Screenshot API Ready - V2',
      usage: '/api/screenshot?url=YOUR_URL&selector=ELEMENT_SELECTOR&scale=4',
      chromium: 'Using @sparticuz/chromium optimized for Vercel'
    });
  }

  const { url, selector, width = 630, height = 810, scale = 4 } = req.query;
  
  console.log(`📸 Capturing: ${selector} from ${url} at ${scale}x scale`);
  
  try {
    // Configure chromium for serverless with extra fonts/libraries
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath('/tmp'),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    
    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height),
      deviceScaleFactor: parseInt(scale)
    });
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for fonts and layout
    await page.waitForTimeout(6000);
    
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
      throw new Error(`Element ${selector} not found on page`);
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
      service: 'vercel-puppeteer-screenshot-v2',
      troubleshooting: 'Check browser console for detailed error info'
    });
  }
}

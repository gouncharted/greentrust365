const chromium = require('chrome-aws-lambda');

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
      status: 'Screenshot API Ready',
      usage: '/api/screenshot?url=YOUR_URL&selector=ELEMENT_SELECTOR&scale=4',
      chromium: chromium ? 'Available' : 'Not Available'
    });
  }

  const { url, selector, width = 630, height = 810, scale = 4 } = req.query;
  
  console.log(`📸 Capturing: ${selector} from ${url} at ${scale}x scale`);
  
  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
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
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    await page.addStyleTag({
      content: '.pdf-export-ui { display: none !important; }'
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
    
    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
    
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
    res.status(500).json({ 
      error: error.message,
      service: 'vercel-puppeteer-screenshot'
    });
  }
}

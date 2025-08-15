// Add this enhanced function to your existing code

async function renderSinglePagePDF(page, selector, mode = 'fullbleed') {
  // Define dimensions based on mode
  // Using 72 DPI to match your existing layout
  const dimensions = {
    fullbleed: { 
      width: 8.75, 
      height: 11.25, 
      pixelWidth: 630,  // 8.75" × 72 DPI
      pixelHeight: 810, // 11.25" × 72 DPI
      class: 'print-full-bleed' 
    },
    trim: { 
      width: 8.5, 
      height: 11, 
      pixelWidth: 612,  // 8.5" × 72 DPI
      pixelHeight: 792, // 11" × 72 DPI
      class: 'print-trim-only' 
    }
  };
  
  const config = dimensions[mode] || dimensions.fullbleed;
  
  // Inject styles and apply print class
  await page.evaluateHandle((sel, cfg) => {
    // Remove any existing print classes
    document.body.classList.remove('print-full-bleed', 'print-trim-only', 'print-active');
    
    // Add the appropriate print class
    document.body.classList.add(cfg.class, 'print-active');
    
    // Create or update print styles
    let printStyle = document.getElementById('dynamic-print-styles');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'dynamic-print-styles';
      document.head.appendChild(printStyle);
    }
    
    printStyle.textContent = `
      @page {
        size: ${cfg.width}in ${cfg.height}in;
        margin: 0;
      }
      
      /* Reset everything */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${cfg.pixelWidth}px !important;
        height: ${cfg.pixelHeight}px !important;
        overflow: hidden !important;
      }
      
      /* Hide all other elements */
      body > *:not(${sel}) {
        display: none !important;
      }
      
      /* Position and size the target element */
      ${sel} {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        transform-origin: top left !important;
      }
      
      /* Mode-specific sizing */
      ${cfg.class === 'print-full-bleed' ? `
        /* Full bleed mode - keep at 630×810 */
        ${sel} {
          width: 630px !important;
          height: 810px !important;
        }
        ${sel} .page-trim {
          /* Keep trim at original position and size */
          width: 612px !important;
          height: 792px !important;
          position: absolute !important;
          top: 9px !important;
          left: 9px !important;
        }
      ` : `
        /* Trim mode - crop to 612×792 */
        ${sel} {
          width: 612px !important;
          height: 792px !important;
        }
        ${sel} .page-trim {
          /* Move trim to 0,0 and keep at 612×792 */
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 612px !important;
          height: 792px !important;
        }
        /* Hide bleed area background */
        ${sel} {
          background: transparent !important;
        }
      `}
    `;
    
    // If trim mode, physically adjust the DOM
    if (cfg.class === 'print-trim-only') {
      const element = document.querySelector(sel);
      const trimElement = element?.querySelector('.page-trim');
      if (element && trimElement) {
        // Override inline styles for trim mode
        element.style.width = '612px';
        element.style.height = '792px';
        trimElement.style.top = '0';
        trimElement.style.left = '0';
      }
    }
    
    // Force reflow
    document.body.offsetHeight;
    
  }, selector, config);
  
  // Wait for styles to apply
  await sleep(100);
  
  // Verify element exists
  const exists = await page.$(selector);
  if (!exists) throw new Error(`Selector not found: ${selector}`);
  
  // Generate PDF with mode-specific dimensions
  return await page.pdf({
    printBackground: true,
    preferCSSPageSize: false,
    width: `${config.width}in`,
    height: `${config.height}in`,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    scale: 1,
  });
}

// Modified main handler to support mode parameter
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const url = params.url;
    let type = (params.type || '').trim();
    const mode = (params.mode || 'fullbleed').toLowerCase(); // 'fullbleed' or 'trim'
    const pageCountOverride = params.pageCount ? parseInt(params.pageCount, 10) : null;
    const waitMs = params.wait ? parseInt(params.wait, 10) : 1500;
    
    // Validate mode
    if (!['fullbleed', 'trim'].includes(mode)) {
      return res.status(400).json({ 
        error: 'Invalid mode. Use "fullbleed" or "trim"' 
      });
    }
    
    const token = process.env.BROWSERLESS_TOKEN;
    const region = process.env.BROWSERLESS_REGION || 'sfo';

    if (!url) return res.status(400).json({ error: 'Missing ?url' });
    if (!token) return res.status(500).json({ error: 'Missing BROWSERLESS_TOKEN env var' });

    // ... (rest of your existing type detection code) ...

    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://production-${region}.browserless.io?token=${token}`
    });

    const page = await browser.newPage();
    
    // Set viewport based on mode - using 72 DPI dimensions
    const viewportDimensions = mode === 'fullbleed' 
      ? { width: 630, height: 810 }  // 8.75" x 11.25" at 72 DPI
      : { width: 612, height: 792 }; // 8.5" x 11" at 72 DPI
    
    await page.setViewport({
      ...viewportDimensions,
      deviceScaleFactor: 1,
    });
    
    // Optional: Set media type to print
    await page.emulateMediaType('print');
    
    await page.goto(url, { waitUntil: 'networkidle0' });
    await sleep(waitMs);

    const pdfBuffers = [];
    const worksheetConfig = worksheetConfigs[type];
    const pageCount = pageCountOverride || worksheetConfig.pageCount;
    
    for (let i = 1; i <= pageCount; i++) {
      const selector = `#${type}-page${i}`;
      
      if (i > 1) {
        await page.goto(url, { waitUntil: 'networkidle0' });
        await sleep(waitMs);
      }
      
      // Pass mode to render function
      const singlePage = await renderSinglePagePDF(page, selector, mode);
      pdfBuffers.push(singlePage);
    }

    await browser.close();

    // Merge PDFs with correct dimensions
    const dimensions = mode === 'fullbleed'
      ? { width: 8.75, height: 11.25 }
      : { width: 8.5, height: 11 };
    
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const src = await PDFDocument.load(buf);
      const pages = await mergedPdf.copyPages(src, src.getPageIndices());
      pages.forEach(p => {
        p.setSize(dimensions.width * 72, dimensions.height * 72);
        mergedPdf.addPage(p);
      });
    }
    
    const mergedBytes = await mergedPdf.save();
    
    // Include mode in filename
    const baseName = (worksheetConfig.name || type).replace(/\s+/g, '-').toLowerCase();
    const filename = `${baseName}-${mode}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(Buffer.from(mergedBytes));
    
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}

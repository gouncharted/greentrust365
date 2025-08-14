import { chromium } from 'playwright-core';
import { PDFDocument } from 'pdf-lib';

// Keep this in sync with your front-end config
const worksheetConfigs = {
  ornca:  { name: 'Ornamental CA Worksheet 2026',          pageCount: 4, color: '#228B22' },
  ornstd: { name: 'Ornamental STD Worksheet 2026',         pageCount: 4, color: '#32CD32' },
  gstca:  { name: 'Golf and Turf Sports CA Worksheet 2026',pageCount: 4, color: '#006400' },
  gststd: { name: 'Golf and Turf Sports STD Worksheet 2026',pageCount: 4, color: '#9ACD32' },
  lawnca: { name: 'Lawn CA Worksheet 2026',                 pageCount: 4, color: '#2E8B57' },
  lawnstd:{ name: 'Lawn STD Worksheet 2026',                pageCount: 4, color: '#3CB371' },
  pallet: { name: 'Pallet Offers Worksheet 2026',           pageCount: 4, color: '#2E8B57' },
  mpo:    { name: 'Multipak Offers Worksheet 2026',         pageCount: 2, color: '#3CB371' }
};

// Constants for your fixed export block
const EXPORT_PX = { width: 630, height: 810 };           // your div size
const BLEED_IN = { width: 8.75, height: 11.25 };         // PDF page size
const DEFAULT_SCALE = 3;                                  // deviceScaleFactor 2–4 typical
const DEFAULT_WAIT_MS = 1500;

/**
 * Render exactly one page (selector) to a single-page PDF buffer at bleed size.
 */
async function renderSinglePagePDF(page, selector) {
  // Isolation & print CSS
  await page.addStyleTag({
    content: `
      /* Hide UI and everything except target element */
      .pdf-export-ui { display: none !important; }
      body * { visibility: hidden !important; }
      ${selector}, ${selector} * { visibility: visible !important; }

      /* Force PDF page to exact bleed size */
      @page { size: ${BLEED_IN.width}in ${BLEED_IN.height}in; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      html, body { width: ${BLEED_IN.width}in; height: ${BLEED_IN.height}in; }

      /* Pin the target element to the top-left, exact pixel size, no transforms */
      ${selector} {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${EXPORT_PX.width}px !important;
        height: ${EXPORT_PX.height}px !important;
        transform: none !important;
        box-shadow: none !important;
      }
    `
  });

  // Ensure the target exists before printing
  const exists = await page.$(selector);
  if (!exists) throw new Error(`Selector not found: ${selector}`);

  // Print exactly one PDF page
  const pdfBuffer = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,   // uses @page size above
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  return pdfBuffer;
}

export default async function handler(req, res) {
  // --- CORS (optional) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const url = params.url;
  const type = (params.type || '').trim(); // e.g., 'gststd', 'gstca', 'ornstd', etc.
  const pageCountOverride = params.pageCount ? parseInt(params.pageCount, 10) : null;
  const scale = params.scale ? parseInt(params.scale, 10) : DEFAULT_SCALE;
  const wait = params.wait ? parseInt(params.wait, 10) : DEFAULT_WAIT_MS;

  if (!url) return res.status(400).json({ error: 'Missing ?url' });

  // Resolve type: either provided or auto-detect the first one that has "-page1"
  let resolvedType = type;
  if (!resolvedType) {
    // Light auto-detect: check each known type for presence of #<type>-page1
    // We’ll do a fast pass in the page after navigation.
  }

  if (!process.env.BROWSERLESS_TOKEN) {
    return res.status(500).json({ error: 'Missing BROWSERLESS_TOKEN environment variable' });
  }

  let browser;
  try {
    // Connect to Browserless hosted Chrome
    browser = await chromium.connect({
  wsEndpoint: `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
});

    const context = await browser.newContext({
      viewport: {
        width: EXPORT_PX.width,
        height: EXPORT_PX.height,
        deviceScaleFactor: scale
      }
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait);

    // If the type wasn't provided, try to detect it by probing for #<key>-page1
    if (!resolvedType) {
      for (const key of Object.keys(worksheetConfigs)) {
        const found = await page.$(`#${key}-page1`);
        if (found) { resolvedType = key; break; }
      }
    }

    if (!resolvedType || !worksheetConfigs[resolvedType]) {
      throw new Error(`Unknown or undetectable 'type'. Provide one of: ${Object.keys(worksheetConfigs).join(', ')}.`);
    }

    const baseConfig = worksheetConfigs[resolvedType];
    const pageCount = pageCountOverride || baseConfig.pageCount;

    // Render each page to a single-page PDF buffer
    const pdfBuffers = [];
    for (let i = 1; i <= pageCount; i++) {
      const selector = `#${resolvedType}-page${i}`;

      // For each page, we add isolation CSS, print one page, then remove it before next page.
      // To simplify: reload the page between prints (ensures a clean DOM for each page’s injected CSS)
      if (i > 1) {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(wait);
      }

      const singlePagePDF = await renderSinglePagePDF(page, selector);
      pdfBuffers.push(singlePagePDF);
    }

    // Merge all single-page PDFs into one
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const src = await PDFDocument.load(buf);
      const copied = await mergedPdf.copyPages(src, src.getPageIndices());
      copied.forEach(p => mergedPdf.addPage(p));
    }
    const mergedBytes = await mergedPdf.save();

    // Name the file from config if available
    const filenameBase = (baseConfig.name || resolvedType)
      .replace(/\s+/g, '-')
      .toLowerCase();
    const filename = `${filenameBase}.pdf`;

    // Return PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(Buffer.from(mergedBytes));

  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

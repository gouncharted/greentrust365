import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

const BLEED_IN = { width: 8.75, height: 11.25 };   // Full bleed size
const DPI = 96; // Standard web DPI
const VIEWPORT = {
  width: Math.round(BLEED_IN.width * DPI),   // 840px
  height: Math.round(BLEED_IN.height * DPI),  // 1080px
};
const DEFAULT_WAIT_MS = 1500;

const worksheetConfigs = {
  ornca:  { name: 'Ornamental CA Worksheet 2026',            pageCount: 4 },
  ornstd: { name: 'Ornamental STD Worksheet 2026',           pageCount: 4 },
  gstca:  { name: 'Golf and Turf Sports CA Worksheet 2026',  pageCount: 4 },
  gststd: { name: 'Golf and Turf Sports STD Worksheet 2026', pageCount: 4 },
  lawnca: { name: 'Lawn CA Worksheet 2026',                  pageCount: 4 },
  lawnstd:{ name: 'Lawn STD Worksheet 2026',                 pageCount: 4 },
  pallet: { name: 'Pallet Offers Worksheet 2026',            pageCount: 4 },
  mpo:    { name: 'Multipak Offers Worksheet 2026',          pageCount: 2 }
};

async function detectTypeFromHtml(html) {
  for (const key of Object.keys(worksheetConfigs)) {
    if (html.includes(`id="${key}-page1"`)) return key;
  }
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function renderSinglePagePDF(page, selector) {
  // First, inject styles BEFORE evaluating the page
  await page.evaluateHandle((sel, bleedWidth, bleedHeight) => {
    // Create a high-priority style element
    const style = document.createElement('style');
    style.textContent = `
      /* Hide everything except target */
      .pdf-export-ui { display: none !important; }
      body * { 
        visibility: hidden !important; 
        position: static !important;
      }
      ${sel}, ${sel} * { 
        visibility: visible !important; 
      }

      /* Reset page and body */
      @page { 
        size: ${bleedWidth}in ${bleedHeight}in; 
        margin: 0; 
      }
      
      html {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        width: ${bleedWidth}in !important;
        height: ${bleedHeight}in !important;
        overflow: hidden !important;
        position: relative !important;
      }
      
      /* Position and size the target element */
      ${sel} {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: ${bleedWidth}in !important;
        height: ${bleedHeight}in !important;
        max-width: ${bleedWidth}in !important;
        max-height: ${bleedHeight}in !important;
        transform: none !important;
        transform-origin: top left !important;
        box-shadow: none !important;
        border: none !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      }
      
      /* Ensure content fills the container */
      ${sel} > * {
        max-width: 100% !important;
        max-height: 100% !important;
      }
    `;
    
    // Insert at the end of head to override other styles
    document.head.appendChild(style);
    
    // Also force the element to the correct size via JS
    const element = document.querySelector(sel);
    if (element) {
      element.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: ${bleedWidth}in !important;
        height: ${bleedHeight}in !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        box-sizing: border-box !important;
      `;
      
      // Move element to body root if nested
      if (element.parentNode !== document.body) {
        document.body.appendChild(element);
      }
    }
  }, selector, BLEED_IN.width, BLEED_IN.height);

  // Wait for any reflows
  await sleep(100);

  // Verify element exists and is visible
  const exists = await page.$(selector);
  if (!exists) throw new Error(`Selector not found: ${selector}`);

  // Generate PDF with exact dimensions
  return await page.pdf({
    printBackground: true,
    preferCSSPageSize: false, // We'll set exact dimensions
    width: `${BLEED_IN.width}in`,
    height: `${BLEED_IN.height}in`,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    scale: 1, // No scaling
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const url = params.url;
    let type = (params.type || '').trim();
    const pageCountOverride = params.pageCount ? parseInt(params.pageCount, 10) : null;
    const waitMs = params.wait ? parseInt(params.wait, 10) : DEFAULT_WAIT_MS;
    
    // Add debug mode flag
    const debug = params.debug === 'true';

    const token = process.env.BROWSERLESS_TOKEN;
    const region = process.env.BROWSERLESS_REGION || 'sfo';

    if (!url) return res.status(400).json({ error: 'Missing ?url' });
    if (!token) return res.status(500).json({ error: 'Missing BROWSERLESS_TOKEN env var' });

    if (!type) {
      const htmlResp = await fetch(url);
      if (!htmlResp.ok) {
        return res.status(400).json({ error: `Failed to load URL for detection (${htmlResp.status})` });
      }
      const html = await htmlResp.text();
      const detected = await detectTypeFromHtml(html);
      if (detected) type = detected;
    }
    
    if (!type || !worksheetConfigs[type]) {
      return res.status(400).json({ 
        error: `Provide a valid ?type. Options: ${Object.keys(worksheetConfigs).join(', ')}` 
      });
    }

    const base = worksheetConfigs[type];
    const pageCount = pageCountOverride || base.pageCount;

    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://production-${region}.browserless.io?token=${token}`
    });

    const page = await browser.newPage();
    
    // Set viewport to match PDF dimensions
    await page.setViewport({
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      deviceScaleFactor: 1, // Changed from 2 to 1 for accurate sizing
    });
    
    // Set user agent to ensure consistent rendering
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle0' });
    await sleep(waitMs);
    
    // If debug mode, take a screenshot of the first page before PDF generation
    if (debug) {
      const screenshot = await page.screenshot({ 
        fullPage: false,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height }
      });
      console.log('Debug screenshot taken, size:', screenshot.length, 'bytes');
    }

    const pdfBuffers = [];
    for (let i = 1; i <= pageCount; i++) {
      const selector = `#${type}-page${i}`;

      if (i > 1) {
        // Reload page for each subsequent page to ensure clean state
        await page.goto(url, { waitUntil: 'networkidle0' });
        await sleep(waitMs);
      }

      const singlePage = await renderSinglePagePDF(page, selector);
      pdfBuffers.push(singlePage);
      
      if (debug) {
        console.log(`Page ${i} PDF size:`, singlePage.length, 'bytes');
      }
    }

    await browser.close();

    // Merge PDFs
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const src = await PDFDocument.load(buf);
      const pages = await mergedPdf.copyPages(src, src.getPageIndices());
      pages.forEach(p => {
        // Ensure page size is correct when adding
        p.setSize(BLEED_IN.width * 72, BLEED_IN.height * 72); // 72 points per inch
        mergedPdf.addPage(p);
      });
    }
    const mergedBytes = await mergedPdf.save();

    const filenameBase = (base.name || type).replace(/\s+/g, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filenameBase}.pdf"`);
    res.send(Buffer.from(mergedBytes));
    
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}

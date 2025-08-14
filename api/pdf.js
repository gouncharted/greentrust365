import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

const EXPORT_PX = { width: 630, height: 810 };      // your div size
const BLEED_IN  = { width: 8.75, height: 11.25 };   // PDF page size
const DEFAULT_WAIT_MS = 1500;

const worksheetConfigs = {
  ornca:  { name: 'Ornamental CA Worksheet 2026',            pageCount: 4 },
  ornstd: { name: 'Ornamental STD Worksheet 2026',           pageCount: 4 },
  gstca:  { name: 'Golf and Turf Sports CA Worksheet 2026',  pageCount: 4 },
  gststd: { name: 'Golf and Turf Sports STD Worksheet 2026', pageCount: 4 },
  lawnca: { name: 'Lawn CA Worksheet 2026',                   pageCount: 4 },
  lawnstd:{ name: 'Lawn STD Worksheet 2026',                  pageCount: 4 },
  pallet: { name: 'Pallet Offers Worksheet 2026',             pageCount: 4 },
  mpo:    { name: 'Multipak Offers Worksheet 2026',           pageCount: 2 }
};

// Simple auto-detect: look for id="<key>-page1" in HTML
async function detectTypeFromHtml(html) {
  for (const key of Object.keys(worksheetConfigs)) {
    if (html.includes(`id="${key}-page1"`)) return key;
  }
  return null;
}

async function renderSinglePagePDF(page, selector) {
  // Inject isolation + print CSS
  await page.addStyleTag({
    content: `
      .pdf-export-ui { display:none !important; }
      body * { visibility:hidden !important; }
      ${selector}, ${selector} * { visibility:visible !important; }

      @page { size: ${BLEED_IN.width}in ${BLEED_IN.height}in; margin:0; }
      html, body {
        margin:0 !important; padding:0 !important; background:#fff !important;
        width:${BLEED_IN.width}in; height:${BLEED_IN.height}in;
      }
      ${selector} {
        position:fixed !important; top:0 !important; left:0 !important;
        width:${EXPORT_PX.width}px !important; height:${EXPORT_PX.height}px !important;
        box-shadow:none !important; transform:none !important;
      }
    `
  });

  const exists = await page.$(selector);
  if (!exists) throw new Error(`Selector not found: ${selector}`);

  // Print exactly one page at the bleed size, keeping vectors/text
  return await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
}

export default async function handler(req, res) {
  // CORS (optional)
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const params   = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const url      = params.url;
    let   type     = (params.type || '').trim();   // optional; auto-detected if missing
    const pageCountOverride = params.pageCount ? parseInt(params.pageCount,10) : null;
    const waitMs   = params.wait ? parseInt(params.wait,10) : DEFAULT_WAIT_MS;

    const token  = process.env.BROWSERLESS_TOKEN;
    const region = process.env.BROWSERLESS_REGION || 'sfo';

    if (!url)   return res.status(400).json({ error: 'Missing ?url' });
    if (!token) return res.status(500).json({ error: 'Missing BROWSERLESS_TOKEN env var' });

    // Auto-detect type from HTML if not provided
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
      return res.status(400).json({ error: `Provide a valid ?type. Options: ${Object.keys(worksheetConfigs).join(', ')}` });
    }

    const base = worksheetConfigs[type];
    const pageCount = pageCountOverride || base.pageCount;

    // Connect to Browserless (library/WebSocket)
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://production-${region}.browserless.io?token=${token}`
    });

    const page = await browser.newPage();
    // Set viewport to your export block size at a nice density (3 is a good start)
    await page.setViewport({ width: EXPORT_PX.width, height: EXPORT_PX.height, deviceScaleFactor: 3 });

    // Load once
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(waitMs);

    const pdfBuffers = [];
    for (let i = 1; i <= pageCount; i++) {
      const selector = `#${type}-page${i}`;

      // For a clean DOM before injecting styles each time, reload between pages
      if (i > 1) {
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(waitMs);
      }

      const singlePage = await renderSinglePagePDF(page, selector);
      pdfBuffers.push(singlePage);
    }

    await browser.close();

    // Merge pages with pdf-lib (preserves vector content)
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const src = await PDFDocument.load(buf);
      const pages = await mergedPdf.copyPages(src, src.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }
    const mergedBytes = await mergedPdf.save();

    const filenameBase = (base.name || type).replace(/\s+/g,'-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filenameBase}.pdf"`);
    res.send(Buffer.from(mergedBytes));
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}

import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

const BLEED_IN  = { width: 8.75, height: 11.25 };   // Full bleed size
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
  await page.addStyleTag({
    content: `
      .pdf-export-ui { display:none !important; }
      body * { visibility:hidden !important; }
      ${selector}, ${selector} * { visibility:visible !important; }

      @page { size: ${BLEED_IN.width}in ${BLEED_IN.height}in; margin:0; }
      html, body {
        margin:0 !important;
        padding:0 !important;
        background:#fff !important;
        width:${BLEED_IN.width}in !important;
        height:${BLEED_IN.height}in !important;
      }
      ${selector} {
        position:fixed !important;
        top:0 !important;
        left:0 !important;
        width:${BLEED_IN.width}in !important;
        height:${BLEED_IN.height}in !important;
        transform:none !important;
        box-shadow:none !important;
      }
    `
  });

  const exists = await page.$(selector);
  if (!exists) throw new Error(`Selector not found: ${selector}`);

  return await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const params   = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const url      = params.url;
    let   type     = (params.type || '').trim();
    const pageCountOverride = params.pageCount ? parseInt(params.pageCount,10) : null;
    const waitMs   = params.wait ? parseInt(params.wait,10) : DEFAULT_WAIT_MS;

    const token  = process.env.BROWSERLESS_TOKEN;
    const region = process.env.BROWSERLESS_REGION || 'sfo';

    if (!url)   return res.status(400).json({ error: 'Missing ?url' });
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
      return res.status(400).json({ error: `Provide a valid ?type. Options: ${Object.keys(worksheetConfigs).join(', ')}` });
    }

    const base = worksheetConfigs[type];
    const pageCount = pageCountOverride || base.pageCount;

    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://production-${region}.browserless.io?token=${token}`
    });

    const page = await browser.newPage();
    // Viewport is irrelevant for final size because we set in CSS to full page bleed
    await page.setViewport({
      width: 1400,  // large enough so scaling doesn't clip
      height: 2000,
      deviceScaleFactor: 2
    });

    await page.goto(url, { waitUntil: 'networkidle0' });
    await sleep(waitMs);

    const pdfBuffers = [];
    for (let i = 1; i <= pageCount; i++) {
      const selector = `#${type}-page${i}`;

      if (i > 1) {
        await page.goto(url, { waitUntil: 'networkidle0' });
        await sleep(waitMs);
      }

      const singlePage = await renderSinglePagePDF(page, selector);
      pdfBuffers.push(singlePage);
    }

    await browser.close();

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

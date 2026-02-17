const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const yaml = require('js-yaml');
const { validateResume } = require('./schema');
const { DEFAULTS_DIR } = require('./config');

// Auto-fit: measures content height and scales CSS variables to fit one page
const AUTOFIT_SCRIPT = `
<script>
(function() {
  var el = document.querySelector('.resume');
  if (!el) return;

  function fit() {
    // PDF content area: Letter 1056px minus 12mm top + 12mm bottom margins (~91px)
    var CONTENT_MAX = 963; // 2px safety buffer

    el.style.minHeight = '0';
    var elStyle = getComputedStyle(el);
    var padV = (parseFloat(elStyle.paddingTop) || 0) + (parseFloat(elStyle.paddingBottom) || 0);
    var target = CONTENT_MAX + padV;

    var vars = [
      { n: '--font-base',           min: 10,   px: true },
      { n: '--font-name',           min: 28,   px: true },
      { n: '--font-section',        min: 14,   px: true },
      { n: '--font-heading',        min: 12,   px: true },
      { n: '--font-dates',          min: 9,    px: true },
      { n: '--font-contact',        min: 8,    px: true },
      { n: '--line-height',         min: 1.15, px: false },
      { n: '--bullet-line-height',  min: 1.1,  px: false },
      { n: '--section-spacing',     min: 6,    px: true },
      { n: '--section-first-spacing', min: 0,  px: true },
      { n: '--experience-spacing',  min: 0,    px: true },
      { n: '--skills-spacing',      min: 1,    px: true },
    ];

    var root = document.documentElement;
    var orig = vars.map(function(v) { return parseFloat(getComputedStyle(root).getPropertyValue(v.n)) || 0; });

    for (var i = 0; i < 6; i++) {
      if (el.scrollHeight <= target) break;
      var ratio = target / el.scrollHeight;
      vars.forEach(function(v, idx) {
        var cur = parseFloat(getComputedStyle(root).getPropertyValue(v.n)) || orig[idx];
        var val = Math.max(v.min, cur * ratio);
        root.style.setProperty(v.n, v.px ? val + 'px' : val);
      });
    }

    // Store diagnostics
    var fontBase = parseFloat(getComputedStyle(root).getPropertyValue('--font-base')) || orig[0];
    el.dataset.autofitRatio = (orig[0] > 0 ? fontBase / orig[0] : 1).toFixed(3);
    el.dataset.autofitOverflow = el.scrollHeight > target ? '1' : '0';

    el.style.minHeight = '';
    el.dataset.autofit = 'done';
  }

  // Wait for fonts before measuring — layout shifts after font swap
  document.fonts.ready.then(fit);
})();
</script>`;

function loadResume(dataPath) {
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = yaml.load(raw);
  return validateResume(data);
}

function renderHtml(data, { templatePath, cssPath, fit } = {}) {
  const tplFile = templatePath || path.join(DEFAULTS_DIR, 'template.njk');
  const tplDir = path.dirname(tplFile);

  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(tplDir), {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
  });

  env.addFilter('join', (arr, separator = ', ') =>
    Array.isArray(arr) ? arr.join(separator) : arr
  );

  const cssFile = cssPath || path.join(DEFAULTS_DIR, 'styles.css');
  const css = fs.readFileSync(cssFile, 'utf8');

  let html = env.render(path.basename(tplFile), { ...data, css });
  if (fit) {
    html = html.replace('</body>', `${AUTOFIT_SCRIPT}\n</body>`);
  }
  return html;
}

async function buildPdf(htmlContent, outputPath) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    throw new Error(
      'Puppeteer is required for PDF generation.\n' +
        'Install it: npm install puppeteer'
    );
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set viewport to match PDF content area (Letter minus 10mm margins each side)
  await page.setViewport({ width: 741, height: 1056 });
  await page.emulateMediaType('print');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Wait for auto-fit script to finish (runs after fonts.ready)
  const hasAutofit = htmlContent.includes('data-autofit') || htmlContent.includes('autofit');
  if (hasAutofit) {
    await page.waitForFunction(
      () => document.querySelector('.resume')?.dataset.autofit === 'done',
      { timeout: 5000 }
    );

    const diag = await page.evaluate(() => {
      const el = document.querySelector('.resume');
      return {
        ratio: parseFloat(el?.dataset.autofitRatio) || 1,
        overflow: el?.dataset.autofitOverflow === '1',
      };
    });

    if (diag.overflow) {
      console.log('warn: content exceeds one page even at minimum sizes — remove some content');
    } else if (diag.ratio < 0.85) {
      const pct = Math.round(diag.ratio * 100);
      console.log(`warn: content was scaled to ${pct}% to fit — consider trimming for readability`);
    }
  }

  await page.pdf({
    path: outputPath,
    format: 'Letter',
    margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    printBackground: true,
  });
  await browser.close();
}

function nameSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '_');
}

module.exports = { loadResume, renderHtml, buildPdf, nameSlug };

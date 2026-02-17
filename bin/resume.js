#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');

program.name('onepg').description('YAML resume builder with auto-fit PDF rendering').version('1.0.0');

program
  .command('build')
  .description('Build resume from YAML into HTML and/or PDF')
  .option('-d, --data <path>', 'path to resume YAML file')
  .option('-o, --output <dir>', 'output directory')
  .option('-t, --template <path>', 'custom Nunjucks template')
  .option('-s, --styles <path>', 'custom CSS file')
  .option('--tags <tags>', 'filter bullets by tags (comma-separated)')
  .option('--format <format>', 'output format: html, pdf, text (default: html,pdf)', 'html,pdf')
  .option('--fit', 'auto-fit content to one page by scaling font sizes')
  .action(async (opts) => {
    const { resolve } = require('../src/config');
    const { loadResume, renderHtml, buildPdf, nameSlug } = require('../src/build');
    const { filterContent } = require('../src/filter');

    const cfg = resolve(opts);
    if (!cfg.data || !fs.existsSync(cfg.data)) {
      console.error(`File not found: ${cfg.data || 'data/resume.yml'}`);
      process.exit(1);
    }

    const raw = loadResume(cfg.data);
    const tags = opts.tags ? opts.tags.split(',').map((t) => t.trim()) : [];
    const data = filterContent(raw, { tags });
    const formats = opts.format.split(',').map((f) => f.trim());

    const outputDir = cfg.output || process.cwd();
    fs.mkdirSync(outputDir, { recursive: true });
    const slug = nameSlug(data.personal.name);

    if (formats.includes('html')) {
      const htmlContent = renderHtml(data, { templatePath: cfg.template, cssPath: cfg.styles, fit: opts.fit });
      const htmlPath = path.join(outputDir, `${slug}_resume.html`);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`HTML: ${htmlPath}`);
    }

    if (formats.includes('pdf')) {
      const htmlContent = renderHtml(data, { templatePath: cfg.template, cssPath: cfg.styles, fit: opts.fit });
      const pdfPath = path.join(outputDir, `${slug}_resume.pdf`);
      await buildPdf(htmlContent, pdfPath);
      console.log(`PDF:  ${pdfPath}`);
    }

    if (formats.includes('text')) {
      const { renderText } = require('../src/text');
      const textPath = path.join(outputDir, `${slug}_resume.txt`);
      fs.writeFileSync(textPath, renderText(data));
      console.log(`TEXT: ${textPath}`);
    }
  });

program
  .command('lint')
  .description('Lint resume for common issues')
  .option('-d, --data <path>', 'path to resume YAML file')
  .option('-j, --jd <path>', 'job description file for skills gap analysis')
  .action((opts) => {
    const { resolve } = require('../src/config');
    const { loadResume } = require('../src/build');
    const { lintResume, formatLintResults } = require('../src/lint');

    const cfg = resolve(opts);
    const data = loadResume(cfg.data);
    const issues = lintResume(data, { jdFile: opts.jd ? path.resolve(opts.jd) : undefined });

    if (issues.length === 0) {
      console.log('No issues found.');
    } else {
      console.log(formatLintResults(issues));
      console.log(`\n${issues.length} issue(s) found.`);
    }
  });

program
  .command('diff')
  .description('Diff two resume YAML files')
  .argument('<file1>', 'first YAML file')
  .argument('<file2>', 'second YAML file')
  .action((file1, file2) => {
    const { diffVersions } = require('../src/versions');
    const lines = diffVersions(path.resolve(file1), path.resolve(file2));
    console.log(lines.join('\n'));
  });

program
  .command('dev')
  .description('Start dev server with live reload')
  .option('-d, --data <path>', 'path to resume YAML file')
  .option('-t, --template <path>', 'custom Nunjucks template')
  .option('-s, --styles <path>', 'custom CSS file')
  .option('-p, --port <number>', 'server port', '3000')
  .option('--fit', 'auto-fit content to one page by scaling font sizes')
  .action((opts) => {
    const { resolve } = require('../src/config');
    const { startDevServer } = require('../src/dev');

    const cfg = resolve(opts);

    startDevServer({
      dataPath: cfg.data,
      templatePath: cfg.template,
      cssPath: cfg.styles,
      port: parseInt(opts.port, 10),
      fit: opts.fit,
    });
  });

program
  .command('init')
  .description('Scaffold a new resume project in the current directory')
  .option('--force', 'overwrite existing files')
  .action((opts) => {
    const { DEFAULTS_DIR } = require('../src/config');

    const files = [
      { rel: 'data/resume.yml', src: path.join(DEFAULTS_DIR, 'starter.yml') },
      { rel: 'resume.config.yml', content: 'output: ./output\n' },
    ];

    let created = 0;
    for (const file of files) {
      const dest = path.resolve(file.rel);
      if (fs.existsSync(dest) && !opts.force) {
        console.log(`  skip ${file.rel} (exists)`);
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (file.src) {
        fs.copyFileSync(file.src, dest);
      } else {
        fs.writeFileSync(dest, file.content);
      }
      console.log(`  create ${file.rel}`);
      created++;
    }

    if (created === 0) {
      console.log('\nNothing to do. Use --force to overwrite.');
    } else {
      console.log('\nEdit data/resume.yml, then run: onepg build');
    }
  });

program.parse();

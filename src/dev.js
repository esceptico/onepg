const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadResume, renderHtml } = require('./build');

const LIVE_RELOAD_SCRIPT = `
<script>
  (function() {
    const es = new EventSource('/__reload');
    es.onmessage = () => location.reload();
  })();
</script>
`;

function startDevServer({ dataPath, templatePath, cssPath, port, fit }) {
  if (!fs.existsSync(dataPath)) {
    console.error(`File not found: ${dataPath}`);
    process.exit(1);
  }

  const clients = new Set();

  function buildHtml() {
    const data = loadResume(dataPath);
    const html = renderHtml(data, { templatePath, cssPath, fit });
    return html.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`);
  }

  const server = http.createServer((req, res) => {
    if (req.url === '/__reload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(':connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    try {
      const html = buildHtml();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Build error:\n${err.message}`);
    }
  });

  const watchPaths = [dataPath];
  if (templatePath) watchPaths.push(templatePath);
  if (cssPath) watchPaths.push(cssPath);

  let debounceTimer = null;
  function notifyClients(filename) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`Changed: ${filename}`);
      for (const client of clients) {
        client.write('data: reload\n\n');
      }
    }, 300);
  }

  const watchers = watchPaths.map((p) => {
    const resolved = path.resolve(p);
    const target = fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);
    return fs.watch(target, { recursive: false }, (event, filename) => {
      if (!filename) return;
      const ext = path.extname(filename);
      if (['.yml', '.yaml', '.njk', '.css'].includes(ext)) {
        notifyClients(filename);
      }
    });
  });

  server.listen(port, () => {
    console.log(`Dev server: http://localhost:${port}`);
    console.log(`Watching: ${watchPaths.join(', ')}`);
    console.log('Press Ctrl+C to stop');
  });

  process.on('SIGINT', () => {
    watchers.forEach((w) => w.close());
    server.close();
    process.exit(0);
  });
}

module.exports = { startDevServer };

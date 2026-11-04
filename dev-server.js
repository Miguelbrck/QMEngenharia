// Servidor local para TESTES: serve o site e executa /api/agendar.
// Uso: node --env-file=.env dev-server.js   (Node 20 ou superior)
const http = require('http');
const fs = require('fs');
const path = require('path');
const agendar = require('./api/agendar.js')

const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/agendar') {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      try { req.body = JSON.parse(raw || '{}'); } catch { req.body = {}; }
      res.status = c => { res.statusCode = c; return res; };
      res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
      agendar(req, res);
    });
    return;
  }

  let file = path.join(__dirname, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(__dirname) || path.basename(file).startsWith('.env')) { res.statusCode = 403; return res.end('403'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Não encontrado'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(3000, () => console.log('Site de teste em http://localhost:3000'));
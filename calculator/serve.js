// serve.js — run with:  node serve.js
// Then open  http://192.168.1.35:3000  on your phone (same WiFi)

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const DIR  = __dirname;   // serves files from this folder

const MIME = {
  '.html': 'text/html',
  '.css' : 'text/css',
  '.js'  : 'text/javascript',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
};

http.createServer((req, res) => {
  // Default to index.html
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  const ext    = path.extname(filePath);
  const mime   = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ✅  Server running!');
  console.log('');
  console.log('  💻  Local  → http://localhost:' + PORT);
  console.log('  📱  Mobile → http://192.168.1.35:' + PORT);
  console.log('');
  console.log('  Make sure your phone is on the same WiFi.');
  console.log('  Press Ctrl+C to stop.\n');
});

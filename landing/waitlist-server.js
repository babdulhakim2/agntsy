const http = require('http');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'waitlist.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'landing',
  created_at TEXT DEFAULT (datetime('now'))
)`);

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'POST' && req.url === '/api/waitlist') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);
        if (!email || !email.includes('@')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Valid email required' }));
          return;
        }
        try {
          db.prepare('INSERT INTO waitlist (email) VALUES (?)').run(email.toLowerCase().trim());
        } catch (e) {
          if (e.message.includes('UNIQUE')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: "You're already on the list!" }));
            return;
          }
          throw e;
        }
        const count = (db.prepare('SELECT COUNT(*) as n FROM waitlist').get()).n;
        console.log(`[waitlist] +${email} (total: ${count})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "You're on the list! 🎉", position: count }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/api/waitlist/count') {
    const count = (db.prepare('SELECT COUNT(*) as n FROM waitlist').get()).n;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count }));
  } else if (req.method === 'GET' && req.url === '/api/waitlist/export') {
    const rows = db.prepare('SELECT email, source, created_at FROM waitlist ORDER BY created_at DESC').all();
    res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=agentsy-waitlist.csv' });
    res.write('email,source,signed_up\n');
    rows.forEach(r => res.write(`${r.email},${r.source},${r.created_at}\n`));
    res.end();
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3002, '127.0.0.1', () => console.log('[waitlist] API running on :3002'));

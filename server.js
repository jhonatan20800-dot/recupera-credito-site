// server.js – API + SQLite + sessão (Render/Free On)
const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

// Banco SQLite no disco (Render persiste enquanto o serviço existir)
const db = new Database('data.db');

// Cria tabela caso não exista
db.prepare(`
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('PF','PJ')),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  cidade TEXT,
  tempo TEXT,
  limite REAL,
  status TEXT DEFAULT 'Novo',
  notas TEXT,
  extra TEXT
);`).run();

// App Express
const app = express();
app.use(express.json());

// permitir hosts externos (proxy + CORS simples)
app.enable('trust proxy');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// sessão simples
app.use(session({
  secret: 'recupera-recupera',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8h
}));

// Servir arquivos estáticos do repositório (index.html, admin.html)
app.use(express.static(path.join(__dirname)));

// rota explícita pro painel admin
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// login hardcoded
const USER = 'ADMIN';
const PASS = 'recupera123';

app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === USER && pass === PASS) {
    req.session.logged = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'invalid' });
  }
});

// logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// API leads (apenas logado)
app.get('/api/leads', (req, res) => {
  if (!req.session.logged) return res.status(401).end();
  const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(rows);
});

app.patch('/api/leads/:id', (req, res) => {
  if (!req.session.logged) return res.status(401).end();
  const id = req.params.id;
  const { status } = req.body;
  db.prepare('UPDATE leads SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, id);
  res.json({ ok: true });
});

// inicia servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

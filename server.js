// server.js – API + SQLite + Sessão + Rotas explícitas (ordem corrigida)

const express   = require('express');
const session   = require('express-session');
const path      = require('path');
const Database  = require('better-sqlite3');

const app  = express();
const ROOT = path.resolve(__dirname);

// === Banco SQLite no disco ===
const db = new Database('data.db');
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
)
`).run();

// === Middlewares básicos ===
app.use(express.json());

// permitir hosts externos (CORS simples)
app.enable('trust proxy');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// sessão simples
app.use(session({
  secret: 'recupera-credito',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8h
}));

// === ROTAS EXPLÍCITAS PRIMEIRO ===

// Home (index)
app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});
app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// Painel admin
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(ROOT, 'admin.html'));
});
app.get('/admin.html', (_req, res) => {
  res.sendFile(path.join(ROOT, 'admin.html'));
});

// === API (exemplos) ===

// listar leads
app.get('/api/leads', (_req, res) => {
  const rows = db.prepare('SELECT * FROM leads').all();
  res.json(rows);
});

// atualizar status lead
app.patch('/api/leads/:id', (req, res) => {
  const { status } = req.body ?? {};
  db.prepare('UPDATE leads SET status=?, updated_at=datetime("now") WHERE id=?')
    .run(status, req.params.id);
  res.json({ ok: true });
});

// login simples
const USER = 'ADMIN';
const PASS = 'recupera123';
app.post('/login', (req, res) => {
  const { user, pass } = req.body ?? {};
  if (user === USER && pass === PASS) {
    req.session.user = user;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Login inválido' });
});
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// debug: listar arquivos (ajuda a checar se admin.html/index.html estão no build)
app.get('/debug/files', (_req, res) => {
  const fs = require('fs');
  try {
    res.json(fs.readdirSync(ROOT));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// === POR ÚLTIMO: arquivos estáticos ===
app.use(express.static(ROOT));

// (opcional) 404 amigável
app.use((req, res) => res.status(404).send('Rota não encontrada'));

// === Start Server ===
const PORT = process.env.PORT || 10000; // Render usa 10000
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});

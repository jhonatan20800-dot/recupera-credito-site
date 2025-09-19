// server.js — API + SQLite + sessão (Render/Free OK)
const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

// Banco SQLite no disco (Render persiste enquanto o serviço existir)
const db = new Database('data.db');
db.prepare(`
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
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
);
`).run();

const app = express();
app.use(express.json());

// sessão simples
app.use(session({
  secret: 's3cret-recupera',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// servir arquivos estáticos do repositório (index.html, admin.html)
app.use(express.static(path.join(__dirname)));

const USER = 'ADMIN';
const PASS = 'recupera123';

app.post('/login', (req, res) => {
  const { user, pass } = req.body || {};
  if ((user || '').toUpperCase() === USER && pass === PASS) {
    req.session.auth = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false, error: 'unauthorized' });
});
app.post('/logout', (req, res) => { req.session.destroy(() => res.json({ ok: true })); });

function requireAuth(req, res, next) {
  if (req.session?.auth) return next();
  return res.status(401).json({ error: 'auth required' });
}

const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

/* ===== API pública (formulários) ===== */
app.post('/api/leads', (req, res) => {
  const b = req.body || {};
  if (!b.nome || !b.whatsapp || !b.tipo) {
    return res.status(400).json({ error: 'campos obrigatórios: nome, whatsapp, tipo' });
  }
  const id = uid();
  db.prepare(`
    INSERT INTO leads(id, created_at, updated_at, tipo, nome, whatsapp, cidade, tempo, limite, status, notas, extra)
    VALUES (@id, @created_at, @updated_at, @tipo, @nome, @whatsapp, @cidade, @tempo, @limite, @status, @notas, @extra)
  `).run({
    id,
    created_at: nowISO(),
    updated_at: nowISO(),
    tipo: b.tipo,
    nome: b.nome,
    whatsapp: b.whatsapp,
    cidade: b.cidade || null,
    tempo: b.tempo || null,
    limite: b.limite ?? null,
    status: 'Novo',
    notas: b.notas || null,
    extra: b.extra ? JSON.stringify(b.extra) : null
  });
  res.json({ ok: true, id });
});

/* ===== API admin (protegida) ===== */
app.get('/api/leads', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT * FROM leads ORDER BY updated_at DESC`).all();
  res.json(rows);
});
app.get('/api/leads/:id', requireAuth, (req, res) => {
  const row = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});
app.patch('/api/leads/:id', requireAuth, (req, res) => {
  const set = [], vals = [];
  const allowed = ['nome', 'whatsapp', 'cidade', 'tempo', 'limite', 'status', 'notas', 'extra', 'tipo'];
  for (const k of allowed) {
    if (k in req.body) {
      set.push(`${k} = ?`);
      vals.push(k === 'extra' && req.body[k] ? JSON.stringify(req.body[k]) : req.body[k]);
    }
  }
  if (!set.length) return res.json({ ok: true });
  set.push('updated_at = ?'); vals.push(nowISO());
  vals.push(req.params.id);
  db.prepare(`UPDATE leads SET ${set.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});
app.delete('/api/leads/:id', requireAuth, (req, res) => {
  db.prepare(`DELETE FROM leads WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));


































































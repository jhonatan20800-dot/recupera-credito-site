// server.js — baseline simples e estável

const express  = require('express');
const path     = require('path');

const app  = express();
const ROOT = path.resolve(__dirname);

// JSON (se precisar)
app.use(express.json());

// ROTAS EXPLÍCITAS PRIMEIRO
app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/index.html', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.get('/admin', (_req, res) => res.sendFile(path.join(ROOT, 'admin.html')));
app.get('/admin.html', (_req, res) => res.sendFile(path.join(ROOT, 'admin.html')));

// API “ping” de teste (opcional)
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// POR ÚLTIMO: arquivos estáticos (se tiver CSS/JS/IMG soltos na raiz)
app.use(express.static(ROOT));

// 404 amigável
app.use((req, res) => res.status(404).send('Not Found'));

// Porta do Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('OK on', PORT));

// Baseline estável com diagnóstico (pode deixar assim)
// Serve index.html e admin.html na raiz.

const express = require('express');
const path = require('path');
const fs = require('fs');

const app  = express();
const ROOT = path.resolve(__dirname);

app.use(express.json());

// ===== DIAGNÓSTICO (pode remover depois) =====
app.get('/_pwd', (_req, res) => res.json({ cwd: ROOT }));
app.get('/_ls', (_req, res) => {
  try {
    const list = fs.readdirSync(ROOT, { withFileTypes: true })
      .map(d => ({ name: d.name, type: d.isDirectory() ? 'dir' : 'file' }));
    res.json({ root: ROOT, files: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// =============================================

app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/index.html', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(ROOT, 'admin.html')));
app.get('/admin.html', (_req, res) => res.sendFile(path.join(ROOT, 'admin.html')));

// Estático (se tiver css/js/img na raiz)
app.use(express.static(ROOT));

app.use((req, res) => {
  res.status(404).send('Not Found. Veja /_ls para confirmar arquivos do deploy.');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('OK on', PORT));

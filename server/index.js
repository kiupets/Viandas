require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDb } = require('./lib/db');

const dashboardRoutes = require('./routes/dashboard');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');

const app = express();
const port = process.env.PORT || 4000;
const distPath = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/menu-items', menuRoutes);
app.use('/api/orders', orderRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Error interno' });
});

connectDb()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Viandas API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  });

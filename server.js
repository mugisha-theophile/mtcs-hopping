require('dotenv').config();
const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression for all responses
app.use(compression());

// Parse JSON bodies with 10mb limit for images
app.use(express.json({ limit: '10mb' }));

// Add caching headers for better performance
app.use((req, res, next) => {
  // Cache static files for 24 hours
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.set('Cache-Control', 'public, max-age=86400');
  }
  // Don't cache HTML
  if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// API routes - must come before static files
app.all('/api/products', require('./api/products'));
app.all('/api/blogs', require('./api/blogs'));
app.all('/api/login', require('./api/login'));

// Serve static files with caching
app.use(express.static(path.join(__dirname), { 
  maxAge: '24h',
  etag: false 
}));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin.html`);
  console.log(`✅ Compression enabled - Faster data transfer`);
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// API routes - must come before static files
app.all('/api/products', require('./api/products'));
app.all('/api/blogs', require('./api/blogs'));
app.all('/api/login', require('./api/login'));

// Serve static files
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin.html`);
});

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../products.json');

// Ensure data file exists
const ensureDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
};

// Read from file
const readFromFile = () => {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data || '[]');
};

// Write to file
const writeToFile = (products) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
};

module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      const products = readFromFile();
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const product = req.body;
      let products = readFromFile();
      
      if (product._id) {
        const index = products.findIndex(p => p._id === product._id);
        if (index !== -1) products[index] = product;
        else products.push(product);
      } else {
        product._id = Date.now().toString();
        products.push(product);
      }
      
      writeToFile(products);
      return res.status(201).json(product);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      let products = readFromFile();
      products = products.filter(p => p._id !== id);
      writeToFile(products);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Products API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

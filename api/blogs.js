const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../blogs.json');

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
};

const readFromFile = () => {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data || '[]');
};

const writeToFile = (blogs) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(blogs, null, 2));
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
      const blogs = readFromFile();
      return res.status(200).json(blogs);
    }

    if (req.method === 'POST') {
      const blog = req.body;
      let blogs = readFromFile();
      
      if (blog._id) {
        const index = blogs.findIndex(b => b._id === blog._id);
        if (index !== -1) blogs[index] = blog;
        else blogs.push(blog);
      } else {
        blog._id = Date.now().toString();
        blogs.push(blog);
      }
      
      writeToFile(blogs);
      return res.status(201).json(blog);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      let blogs = readFromFile();
      blogs = blogs.filter(b => b._id !== id);
      writeToFile(blogs);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Blogs API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

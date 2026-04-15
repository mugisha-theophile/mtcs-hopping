const clientPromise = require('./mongodb');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const client = await clientPromise;
    const db = client.db("mtcshopping");
    const collection = db.collection("blogs");

    // GET all blogs
    if (req.method === 'GET') {
      const blogs = await collection.find({}).toArray();
      return res.status(200).json(blogs);
    }

    // POST - Save new or update existing blog
    if (req.method === 'POST') {
      const blog = req.body;
      let result;

      // Validate image size (5MB max)
      const MAX_IMAGE_SIZE = 5242880;
      if (blog.image && typeof blog.image === 'string' && blog.image.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({ error: 'Blog image too large. Max 5MB' });
      }

      blog.updatedAt = new Date();
      if (!blog.createdAt) {
        blog.createdAt = new Date();
      }

      // Update existing or insert new
      if (blog._id) {
        try {
          const _id = new ObjectId(blog._id);
          const updateData = { ...blog };
          delete updateData._id;
          
          result = await collection.updateOne(
            { _id: _id },
            { $set: updateData },
            { upsert: true }
          );
        } catch (e) {
          // Fallback for string IDs
          result = await collection.updateOne(
            { _id: blog._id },
            { $set: blog },
            { upsert: true }
          );
        }
      } else {
        result = await collection.insertOne(blog);
        blog._id = result.insertedId;
      }

      return res.status(201).json(blog);
    }

    // DELETE blog
    if (req.method === 'DELETE') {
      const { id, _id } = req.query;
      let result;

      if (_id) {
        try {
          result = await collection.deleteOne({ _id: new ObjectId(_id) });
        } catch (e) {
          result = await collection.deleteOne({ _id: _id });
        }
      } else if (id) {
        result = await collection.deleteOne({ _id: id });
      }

      return res.status(200).json({ success: true, result });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Blogs API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

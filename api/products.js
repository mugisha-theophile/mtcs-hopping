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
    const collection = db.collection("products");

    // GET all products
    if (req.method === 'GET') {
      const products = await collection.find({}).toArray();
      return res.status(200).json(products);
    }

    // POST - Save new or update existing product
    if (req.method === 'POST') {
      const product = req.body;
      let result;

      // Validate image size (5MB max)
      const MAX_IMAGE_SIZE = 5242880;
      if (product.image && typeof product.image === 'string' && product.image.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({ error: 'Main image too large. Max 5MB' });
      }

      product.updatedAt = new Date();
      if (!product.createdAt) {
        product.createdAt = new Date();
      }

      // Update existing or insert new
      if (product._id) {
        try {
          const _id = new ObjectId(product._id);
          const updateData = { ...product };
          delete updateData._id;
          
          result = await collection.updateOne(
            { _id: _id },
            { $set: updateData },
            { upsert: true }
          );
        } catch (e) {
          // Fallback for string IDs
          result = await collection.updateOne(
            { _id: product._id },
            { $set: product },
            { upsert: true }
          );
        }
      } else {
        result = await collection.insertOne(product);
        product._id = result.insertedId;
      }

      return res.status(201).json(product);
    }

    // DELETE product
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
    console.error('Products API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

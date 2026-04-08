const clientPromise = require('./mongodb');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("mtcshopping");
    const collection = db.collection("products");

    if (req.method === 'GET') {
      // Add pagination support
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const featured = req.query.featured === 'true';
      const popular = req.query.popular === 'true';

      let query = {};
      if (featured) query = { isFeatured: true, isPopular: false };
      if (popular) query = { isPopular: true, isFeatured: false };

      // Return data WITHOUT full base64 images for list views - FAST LOADING
      const products = await collection
        .find(query)
        .project({ image: 0, subImages: 0 }) // Exclude images on list
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments(query);

      return res.status(200).json({
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Get single product with images
    if (req.method === 'GET' && req.query.id) {
      const id = req.query.id;
      let product;
      
      try {
        product = await collection.findOne({ _id: new ObjectId(id) });
      } catch (e) {
        product = await collection.findOne({ id: id });
      }

      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.status(200).json(product);
    }

    if (req.method === 'POST') {
      const product = req.body;
      let result;

      // Validate images aren't too large
      const MAX_IMAGE_SIZE = 500000; // 500KB limit per image
      
      if (product.image && product.image.length > MAX_IMAGE_SIZE * 2) {
        return res.status(400).json({ error: 'Main image too large. Max 500KB' });
      }

      if (product.subImages && Array.isArray(product.subImages)) {
        for (let img of product.subImages) {
          if (img.length > MAX_IMAGE_SIZE * 2) {
            return res.status(400).json({ error: 'Sub image too large. Max 500KB each' });
          }
        }
      }

      // Ensure price is a number
      if (product.price) {
        product.price = parseFloat(product.price.toString().replace(/[^0-9.]/g, '')) || 0;
      }

      if (product._id) {
        try {
          const _id = new ObjectId(product._id);
          delete product._id;
          result = await collection.updateOne(
            { _id: _id },
            { $set: product },
            { upsert: false }
          );
        } catch (oidError) {
          result = await collection.updateOne(
            { id: product._id },
            { $set: product },
            { upsert: true }
          );
        }
      } else if (product.id) {
        result = await collection.updateOne(
          { id: product.id },
          { $set: product },
          { upsert: true }
        );
      } else {
        result = await collection.insertOne(product);
      }
      
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE') {
      const { id, _id } = req.query;
      let result;
      
      if (_id) {
        try {
          result = await collection.deleteOne({ _id: new ObjectId(_id) });
        } catch (e) {
          result = await collection.deleteOne({ id: _id });
        }
      } else if (id) {
        result = await collection.deleteOne({ id: id });
      }
      
      return res.status(200).json(result);
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Products API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

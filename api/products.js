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
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;
      const featured = req.query.featured === 'true';
      const popular = req.query.popular === 'true';

      let query = {};
      if (featured) query = { isFeatured: true, isPopular: false };
      if (popular) query = { isPopular: true, isFeatured: false };

      // FIXED: Include images in response - removed .project() to get all fields including images
      const products = await collection
        .find(query)
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

      // Validate images aren't too large - increased to 5MB
      const MAX_IMAGE_SIZE = 5242880; // 5MB limit per image
      
      if (product.image && typeof product.image === 'string' && product.image.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({ error: 'Main image too large. Max 5MB' });
      }

      if (product.subImages && Array.isArray(product.subImages)) {
        for (let img of product.subImages) {
          if (typeof img === 'string' && img.length > MAX_IMAGE_SIZE) {
            return res.status(400).json({ error: 'Sub image too large. Max 5MB each' });
          }
        }
      }

      // Ensure price is a number
      if (product.price) {
        product.price = parseFloat(product.price.toString().replace(/[^0-9.]/g, '')) || 0;
      }

      // Set created/updated timestamp
      product.updatedAt = new Date();
      if (!product.createdAt) {
        product.createdAt = new Date();
      }

      if (product._id) {
        try {
          const _id = new ObjectId(product._id);
          const updateData = { ...product };
          delete updateData._id;
          
          result = await collection.updateOne(
            { _id: _id },
            { $set: updateData },
            { upsert: false }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }
        } catch (oidError) {
          console.error('ObjectId error:', oidError);
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
      
      console.log('Product save result:', result);
      return res.status(200).json({ success: true, result });
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

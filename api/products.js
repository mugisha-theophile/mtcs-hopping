const clientPromise = require('./mongodb');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("MtcSHOPPING");
    const collection = db.collection("products");

    if (req.method === 'GET') {
      const products = await collection.find({}).toArray();
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const product = req.body;
      let result;

      if (product.id && !product._id) {
        // Try to update by custom ID if provided and _id is missing
         result = await collection.updateOne(
          { id: product.id },
          { $set: product },
          { upsert: true }
        );
      } else if (product._id) {
        // Update by MongoDB ObjectId
        const _id = new ObjectId(product._id);
        delete product._id;
        result = await collection.updateOne(
          { _id: _id },
          { $set: product }
        );
      } else {
        // New product
        result = await collection.insertOne(product);
      }
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE') {
      const { id, _id } = req.query;
      let result;
      if (_id) {
        result = await collection.deleteOne({ _id: new ObjectId(_id) });
      } else if (id) {
        result = await collection.deleteOne({ id: id });
      }
      return res.status(200).json(result);
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
  }
};

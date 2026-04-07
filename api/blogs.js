const clientPromise = require('./mongodb');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("MtcSHOPPING");
    const collection = db.collection("posts");

    if (req.method === 'GET') {
      const posts = await collection.find({}).toArray();
      return res.status(200).json(posts);
    }

    if (req.method === 'POST') {
      const post = req.body;
      let result;

      if (post._id) {
        try {
          const _id = new ObjectId(post._id);
          delete post._id;
          result = await collection.updateOne({ _id: _id }, { $set: post });
        } catch (oidError) {
          // Fallback for legacy IDs
          result = await collection.updateOne({ id: post._id }, { $set: post }, { upsert: true });
        }
      } else if (post.id) {
        result = await collection.updateOne({ id: post.id }, { $set: post }, { upsert: true });
      } else {
        result = await collection.insertOne(post);
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
    console.error('Blogs API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

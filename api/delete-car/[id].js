import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const carsCollection = db.collection('cars');

  const result = await carsCollection.deleteOne({ _id: new ObjectId(req.query.id) });

  await client.close();
  res.json(result);
}

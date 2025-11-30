import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const carsCollection = db.collection('cars');

  const status = req.body.status;
  const result = await carsCollection.updateOne(
    { _id: new ObjectId(req.query.id) },
    { $set: { status } }
  );

  await client.close();
  res.json(result);
}

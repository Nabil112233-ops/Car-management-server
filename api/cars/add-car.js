import { MongoClient } from 'mongodb';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const carsCollection = db.collection('cars');

  const car = req.body;
  const result = await carsCollection.insertOne(car);

  await client.close();
  res.json(result);
}

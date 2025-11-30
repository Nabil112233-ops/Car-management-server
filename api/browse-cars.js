import { MongoClient } from 'mongodb';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const carsCollection = db.collection('cars');

  const cars = await carsCollection.find().toArray();

  await client.close();
  res.json(cars);
}

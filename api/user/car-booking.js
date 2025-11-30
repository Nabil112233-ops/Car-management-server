import { MongoClient } from 'mongodb';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const bookingsCollection = db.collection('bookings');

  const booking = req.body;
  const result = await bookingsCollection.insertOne(booking);

  await client.close();
  res.json(result);
}
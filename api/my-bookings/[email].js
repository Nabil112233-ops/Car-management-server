import { MongoClient } from 'mongodb';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const bookingsCollection = db.collection('bookings');

  const email = req.query.email;
  const bookings = await bookingsCollection.find({ bookedBy: email }).toArray();

  await client.close();
  res.json(bookings);
}

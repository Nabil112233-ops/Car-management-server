import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const carsCollection = db.collection('cars');

  const updatedCar = req.body;
  const result = await carsCollection.updateOne(
    { _id: new ObjectId(req.query.id) },
    { $set: updatedCar }
  );

  await client.close();
  res.json(result);
}

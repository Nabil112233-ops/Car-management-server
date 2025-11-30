import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('carManagement');
  const usersCollection = db.collection('users');

  const { email, password } = req.body;
  const user = await usersCollection.findOne({ email });
  if (!user) {
    await client.close();
    return res.json({ success: false, message: 'User not found' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  await client.close();
  if (!isPasswordValid) return res.json({ success: false, message: 'Invalid password' });

  res.json({ success: true, message: 'Login successful' });
}

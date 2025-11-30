import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = process.env.Mongo_URI;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('carManagement');
    const usersCollection = db.collection('users');

    const { name, email, password } = req.body;

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) return res.json({ success: false, message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ name, email, password: hashedPassword });

    await client.close();
    res.json({ success: true, message: 'User registered successfully' });
}

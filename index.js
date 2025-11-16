require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
const uri = process.env.Mongo_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const db = client.db('carManagement');
        const carsCollection = db.collection('cars');

        app.get('/featuredCars', async (req, res) => {
            const cars = await carsCollection.find().sort({ createdAt: -1}).limit(6).toArray();
            res.send(cars);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Car management server is running');
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})
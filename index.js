require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const usersCollection = db.collection('users');
        const bookingsCollection = db.collection('bookings');

        app.post('/register', async (req, res) => {
            try {
                console.log(req.body);
                const { name, email, password } = req.body;
                const result = await usersCollection.findOne({ email });

                if (result) {
                    return res.send({ success: false, message: 'User already exists' });
                }

                let hashedPassword = null;
                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                }

                const newUser = {
                    name,
                    email,
                    password: hashedPassword
                }

                await usersCollection.insertOne(newUser);
                res.send({ success: true, message: 'User registered successfully' });
            } catch (error) {
                console.log(error);
                res.send({ success: false, message: 'Registration failed' });
            }

        })
        app.post('/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.send({ success: false, message: 'User not found' });
                }
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.send({ success: false, message: 'Invalid password' });
                }
                res.send({ success: true, message: 'Login successful' });
            } catch (error) {
                res.send({ success: false, message: 'Login failled' });
            }
        })

        app.post('/add-car', async (req, res) => {
            const car = req.body;
            const result = await carsCollection.insertOne(car);
            res.send(result);
        })

        app.post('/car-booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        app.get('/my-bookings/:email', async (req, res) => {
            const email = req.params.email;
            const bookings = await bookingsCollection.find({ bookedBy: email }).toArray();
            res.send(bookings)
        })

        app.get('/my-listings', async (req, res) => {
            const providerEmail = req.query.providerEmail;
            const cars = await carsCollection.find({ providerEmail }).sort({ _id: -1 }).toArray();
            res.send(cars)
        })

        app.get('/car/:id', async (req, res) => {
            const id = req.params.id;
            const car = await carsCollection.findOne({ _id: new ObjectId(id) });
            res.send(car);
        })

        app.get('/featuredCars', async (req, res) => {
            const cars = await carsCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
            res.send(cars);
        })

        app.get('/browse-cars', async (req, res) => {
            const cars = await carsCollection.find().toArray();
            res.send(cars);
        })

        app.patch('/update-status/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const result = await carsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: status } }
            )
            res.send(result);
        })

        app.put('/update-car/:id', async (req, res) => {
            const id = req.params.id;
            const updatedCar = req.body || {};
            const result = await carsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedCar }
            )
            res.send(result);
        })

        app.delete('/delete-car/:id', async (req, res) => {
            const id = req.params.id;
            const result = await carsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
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
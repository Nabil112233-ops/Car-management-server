import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const port = process.env.PORT || 5000;

// Middleware

const allowedOrigins = [
    'http://localhost:5173', // Dev server
    'https://tangerine-stardust-1fd0a1.netlify.app' // Production
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Postman বা direct call
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// MongoDB Connection
const uri = process.env.Mongo_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        const db = client.db('carManagement');
        const carsCollection = db.collection('cars');
        const usersCollection = db.collection('users');
        const bookingsCollection = db.collection('bookings');

        // ===== ROUTES =====

        // Register
        app.post('/register', async (req, res) => {
            try {
                const { name, email, password } = req.body;
                const existingUser = await usersCollection.findOne({ email });
                if (existingUser) return res.json({ success: false, message: 'User already exists' });

                const hashedPassword = await bcrypt.hash(password, 10);
                await usersCollection.insertOne({ name, email, password: hashedPassword });
                res.json({ success: true, message: 'User registered successfully' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Registration failed' });
            }
        });

        // Login
        app.post('/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                const user = await usersCollection.findOne({ email });
                if (!user) return res.json({ success: false, message: 'User not found' });

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) return res.json({ success: false, message: 'Invalid password' });

                res.json({ success: true, message: 'Login successful' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Login failed' });
            }
        });

        // Add Car
        app.post('/add-car', async (req, res) => {
            try {
                const car = req.body;
                const result = await carsCollection.insertOne(car);
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Adding car failed' });
            }
        });

        // Car Booking
        app.post('/car-booking', async (req, res) => {
            try {
                const booking = req.body;
                const result = await bookingsCollection.insertOne(booking);
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Booking failed' });
            }
        });

        // My Bookings
        app.get('/my-bookings/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const bookings = await bookingsCollection.find({ bookedBy: email }).toArray();
                res.json(bookings);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Fetching bookings failed' });
            }
        });

        // My Listings
        app.get('/my-listings', async (req, res) => {
            try {
                const providerEmail = req.query.providerEmail;
                const cars = await carsCollection.find({ providerEmail }).sort({ _id: -1 }).toArray();
                res.json(cars);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Fetching listings failed' });
            }
        });

        // Single Car
        app.get('/car/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const car = await carsCollection.findOne({ _id: new ObjectId(id) });
                res.json(car);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Fetching car failed' });
            }
        });

        // Featured Cars
        app.get('/featuredCars', async (req, res) => {
            try {
                const cars = await carsCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
                res.json(cars);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Fetching featured cars failed' });
            }
        });

        // Browse Cars
        app.get('/browse-cars', async (req, res) => {
            try {
                const cars = await carsCollection.find().toArray();
                res.json(cars);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Fetching cars failed' });
            }
        });

        // Update Status
        app.patch('/update-status/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const status = req.body.status;
                const result = await carsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Update status failed' });
            }
        });

        // Update Car
        app.put('/update-car/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedCar = req.body;
                const result = await carsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedCar });
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Update car failed' });
            }
        });

        // Delete Car
        app.delete('/delete-car/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await carsCollection.deleteOne({ _id: new ObjectId(id) });
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: 'Delete car failed' });
            }
        });

        console.log('All routes are set up successfully!');
    } catch (error) {
        console.error(error);
    }
}

run().catch(console.dir);

// Health Check
app.get('/', (req, res) => {
    res.send('Car management server is running!');
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

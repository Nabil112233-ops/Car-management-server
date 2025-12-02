import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import bcrypt from "bcrypt";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
    origin: [
        "http://localhost:5174",
        "https://tangerine-stardust-1fd0a1.netlify.app"
    ],
    credentials: true
}));
app.use(express.json());

// --- MongoDB Connection ---
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// Create cached DB connection (Vercel optimization)
let db, carsCollection, usersCollection, bookingsCollection;

async function connectDB() {
    if (db) return;

    await client.connect();
    db = client.db("carManagement");

    carsCollection = db.collection("cars");
    usersCollection = db.collection("users");
    bookingsCollection = db.collection("bookings");

    console.log("Database connected!");
}

connectDB();

app.get("/", (req, res) => {
    res.send("🚀 Vercel Serverless Express API is Running!");
});


// -------- Register User --------
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("DEBUG: Registration Request Body:", req.body);

        const exists = await usersCollection.findOne({ email });
        if (exists) {
            return res.status(400).json({ error: "User already exists" });
        }

        let hashed = null;

        if (password) {

            hashed = await bcrypt.hash(password, 10);
        } else {
            hashed = null;
        }

        const result = await usersCollection.insertOne({
            name,
            email,
            password: hashed,
            createdAt: new Date()
        });

        res.json({ message: "Registration successful", userId: result.insertedId });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -------- Login User --------
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("DEBUG: Login Request Body:", req.body);

        const user = await usersCollection.findOne({ email });
        console.log("DEBUG: Found User:", user);
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        if (password) { 
            if (!user.password) {
                return res.status(400).json({ error: "This is a social login account. Please use Google." });
            }}

        if (!password) {
            return res.json({
                message: "Google Login successful",
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            });
        }

        const matched = await bcrypt.compare(password, user.password);
        console.log("DEBUG: Password Match Status:", matched); 
        if (!matched) return res.status(400).json({ error: "Invalid email or password" });

        res.json({
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login Fatal Error:", err);
        res.status(500).json({ error: err.message });
    }
});


// -------- Add Car --------
app.post("/add-car", async (req, res) => {
    try {
        const car = req.body;
        car.createdAt = new Date();

        const result = await carsCollection.insertOne(car);
        res.json({ message: "Car added successfully", id: result.insertedId });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -------- Browse Cars --------
app.get("/browse-cars", async (req, res) => {
    try {
        const cars = await carsCollection.find().toArray();
        res.json(cars);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// My Listings
app.get('/my-listings/:email', async (req, res) => {
    try {
        let email = req.params.email;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email parameter missing' });
        }
        email = email.toLowerCase()
        // console.log("DEBUG: Querying listings for email:", email);
        const cars = await carsCollection.find({ providerEmail : email }).sort({ _id: -1 }).toArray();
        // console.log(`DEBUG: Found ${cars.length} cars for ${email}`);
        res.json(cars);
    } catch (error) {
        // console.error("FATAL ERROR IN MY-LISTINGS:", error);
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

// -------- Featured Cars --------
app.get("/featuredCars", async (req, res) => {
    try {
        const cars = await carsCollection
            .find()
            .sort({ createdAt: -1 })
            .limit(6)
            .toArray();

        res.json(cars);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -------- Update Car --------
app.put("/update-car/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = req.body;

        delete updateData._id; // prevent immutable _id error

        await carsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        res.json({ message: "Car updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -------- Delete Car --------
app.delete("/delete-car/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid Car ID format" });
        }

        const result = await carsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Car not found or already deleted" });
        }

        res.json({ message: "Car deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -------- Book Car --------
app.post("/book-car", async (req, res) => {
    try {
        const booking = req.body;
        booking.createdAt = new Date();

        const result = await bookingsCollection.insertOne(booking);
        res.json({ message: "Booking successful", id: result.insertedId });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// -------- My Bookings --------
app.get("/my-bookings/:email", async (req, res) => {
    try {
        const email = req.params.email;

        const bookings = await bookingsCollection.find({ bookedBy: email }).toArray();
        res.json(bookings);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})


// Export as Serverless Function
export const handler = serverless(app);

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000
require('dotenv').config()
const admin = require("firebase-admin");

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.clx8w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(uri)

//doctors-portal-4c39c-firebase-adminsdk.json




const serviceAccount = require('./doctors-portal-4c39c-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function verifyToken(req, res, next) {
    if (req?.headers?.authorization?.startsWith("Bearer ")) {
        const token = req.headers.authorization.split(" ")[1]
        try {
            const decodedUser = await admin.auth().verifyToken(token);
            req.decodedUser = decodedUser.email;
        }
        catch {

        }
    }
    next()
}

async function run() {
    try {
        await client.connect();
        const database = client.db('doctors_portal')
        const appointmentsCollection = database.collection("appointment")
        const usersCollection = database.collection("users")
        app.get('/appoinments', async (req, res) => {

            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString;

            const query = { email: email, date: date }
            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })
        app.post('/appointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment)
            console.log(result);
            res.json(result)
        })

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;

            }
            res.json({ admin: isAdmin })
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            console.log(result)
            res.json(result);
        })
        app.put('/users', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email }
            const options = { upsert: true }
            const updateDoc = { $set: user }
            const result = await usersCollection.insertOne(filter, updateDoc, options)
            res.json(result);
        })
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body
            console.log("put", req.headers.authorization);
            const filter = { email: user.email }
            const updateDoc = { $set: { role: "admin" } }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.json(result);
        })
    }
    finally {

    }
}
run().catch(console.dir)




app.get('/', (req, res) => {
    res.send("hello")
})
app.listen(port, () => {
    console.log("server running on ", port)
})
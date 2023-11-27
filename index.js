const express = require('express');
const app = express();
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const cors = require('cors');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oiitlmi.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db('empowerPerformaDB').collection('allUsers');
        const paymentsCollection = client.db('empowerPerformaDB').collection('payments');

        //user related api
        app.post('/allusers', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User already exist', insertedId: null });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        //HR related api
        app.get('/users/HR/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let hr = false;
            if (user) {
                hr = user?.role === 'hr';
            }
            res.send({ hr })
        })

        app.get('/allusers/HR/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result)
        })

        app.get('/allusers/HR', async (req, res) => {
            const query = { role: 'employee' };
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        app.patch('/allusers/HR/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const user = await usersCollection.findOne(query);
            const updateDoc = {
                $set: {
                    verified: user?.verified == false ? true : false
                }
            }
            const result = await usersCollection.updateOne(query, updateDoc);
            res.send(result)
        })

        //payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const { salary } = req.body;
            const amount = parseInt(salary * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.get('/payments/:email',async(req,res)=>{
            const query = {email: req.params.email};
            const result = await paymentsCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/payments',async(req,res)=>{
            const payment = req.body;
            const paymentResult = await paymentsCollection.insertOne(payment);
            res.send(paymentResult);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Empower performa is running')
})

app.listen(port, () => {
    console.log(`Empower performa is running on PORT: ${port}`)
})
//importing
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Pusher from 'pusher'
import cors from 'cors'
if (process.env.NODE_ENV !== 'production'){
    dotenv.config()
}

import dbMessages from './dbMessages.js'



//app config
const app = express()
const port = process.env.PORT || 9001

const pusher = new Pusher({
    appId: '1070139',
    key: '3f5cd4eb00ee46e565bd',
    secret: 'aa39f4e147bb6b1fe610',
    cluster: 'us3',
    encrypted: true
  });

//middleware
app.use(express.json())
app.use(cors())

//DB config
mongoose.connect(process.env.DATABASE_URL , { 
    useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => {
    console.log('Connected to Mongoose')
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change)=>{
        console.log(change)

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument
            pusher.trigger('messages', 'inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            }
            )

        } else {
            console.log('Error triggering Pusher')
        }
    })
    
})


//api modules
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    dbMessages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else{
            res.status(200).send(data)
        }
    })
})
app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    dbMessages.create(dbMessage, (err, data) => {
        if (err){
            res.status(500).send(err)
        }
        else {
            res.status(201).send(data)
        }
    })


})
//listerner
app.listen(port, ()=>console.log(`Listening on localhost:${port}`))
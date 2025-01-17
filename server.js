const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const port = 8080

const app = express()

app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'frontend/html/index.html'))
})

app.listen(port, ()=>{
    console.log("Server started")
})
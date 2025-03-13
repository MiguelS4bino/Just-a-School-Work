const express = require('express')
const path = require('path')
const cors = require('cors')

const mongoose = require('mongoose')
require('dotenv').config()

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())
app.use(cors())
const server = require('http').createServer(app)
const io = require('socket.io')(server)


//define onde os arquivos estáticos vão ficar (public)
app.use(express.static(path.join(__dirname, 'public')))
//define a pasta(public) como local onde os templates HTML estao armazenados
app.set('views', path.join(__dirname, 'public'))
//configura o ejs
app.engine('html', require('ejs').renderFile)
//Define o motor dos templates padrão como html, processada pelo ejs
app.set('view engine', 'html')

//Public Route
app.get('/', (req, res) => {
    res.render("index.html")
})
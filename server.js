require('dotenv').config()

const express = require('express')
const path = require('path')
const cors = require('cors')

const mongoose = require('mongoose')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())//configura o express pra conseguir trabalhar com json
app.use(cors())
const server = require('http').createServer(app)
const io = require('socket.io')(server)

//Models
const User = require('./models/User.js')

//define onde os arquivos estáticos vão ficar (public)
app.use(express.static(path.join(__dirname, 'public')))
//define a pasta(public) como local onde os templates HTML estao armazenados(faz o express entender que os arquivos são .html)
app.set('views', path.join(__dirname, 'public', 'Pasta HTML'))
//configura o ejs
app.engine('html', require('ejs').renderFile)
//Define o motor dos templates padrão como html, processada pelo ejs
app.set('view engine', 'html')

//Public Route - Open Route
app.get('/', (req, res) => {
    res.status(200)
    res.render("index")
})

//Privates Routes
app.get('/user/:id', checkToken, async (req, res) => {
    const id = req.params.id

    //check if user exists
    const user = await User.findById(id, '-password')

    if(!user){
        return res.status(404).json({msg: 'Usuário não encontrado'})
    }

    res.status(200).json({ user })
})

function checkToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]//divide o token e o bearer e captura o token

    if(!token){
        return res.status(401).json({msg: 'Acesso Negado!'})
    }

    try{

        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()

    }catch(err){
        return res.status(400).json({msg: 'Token inválido!'})
    }
}

//Register User
app.post('/auth/register', async (req, res) => {

    const {name, email, password, confirm_password} = req.body

    //Validations
    if(!name){
        res.status(422).json({msg: 'Nome é obrigatório1'})
    }
    if(!email){
        res.status(422).json({msg: 'Email é obrigatório1'})
    }
    if(!password){
        res.status(422).json({msg: 'Senha é obrigatório1'})
    }

    if(password !== confirm_password){
        return res.status(422).json({msg: 'As senhas não conferem!'})
    }

    //check if user exist
    const userExists = await User.findOne({email: email})

    if(userExists){
        return res.status(422).json({msg: 'Usuário já cadastrado! Por favor utilize outro email!'})
    }

    //password create & crypt
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    //create user
    const user = new User({
        name,
        email,
        password: passwordHash,
    })

    try{
        await user.save()
        res.status(201).json({msg: 'Usuário criado com sucesso!'})
    }catch(err){
        console.log(err)
        res.status(500).json({msg: 'Aconteceu erro no servidor!'})
    }
})

//Login User
app.post('/auth/login' , async (req, res) => {
    const {email, password} = req.body

    //Validations
    if(!email){
        res.status(422).json({msg: 'Email é obrigatório1'})
    }
    if(!password){
        res.status(422).json({msg: 'Senha é obrigatório1'})
    }

    //check if user exist
    const user = await User.findOne({email: email})

    if(!user){
        return res.status(404).json({msg: 'Usuário não encontrado!'})
    }

    //check if password match
    const checkPassword = await bcrypt.compare(password, user.password)
    if(!checkPassword){
        return res.status(422).json({msg: 'Senha inválida!'})
    }

    try{
        const secret = process.env.SECRET
        const token = jwt.sign(
        {
            id: user._id
        }, 
        secret,)

        res.status(200).json({msg: 'Autentificação realizada com sucesso', token})
    }catch(err){
        console.log(err)
        res.status(500).json({msg: 'Aconteceu erro no servidor!'})
    }

})

//Credencials
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xkapr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
.then( () =>{
    console.log('Conectado ao Banco de Dados.');
    // Inicia o servidor depois da conexão com o banco de dados
    server.listen(3000, () => {
        console.log("Servidor rodando em http://localhost:3000");
    });
})
.catch(
    (err) => console.log(err)
)
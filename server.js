require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");
const checkToken = require("./config/auth.js");

//Models
const User = require("./models/User.js");
const Challenge = require("./models/Challenge.js")

//Open Routes
const authRoutes = require("./routes/authRoutes.js");

//Private Routes
const userRoutes = require("./routes/privateRoutes/userRoutes.js");
const challengeRoutes = require("./routes/privateRoutes/challengeRoutes.js");

const app = express();
app.use(express.json()); //configura o express pra conseguir trabalhar com json
app.use(cors()); //habilita o CORS para todas as rotas

const server = require("http").createServer(app);
const io = require("socket.io")(server);

//Socket.io logica
const onlineUsers = {}

io.on("connection", (socket) => {
  console.log("Novo usuário conectado: ", socket.id)

  //registrar o usuário como online quando ele entrar
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id
    console.log(`Usuário ${userId} registrado com socket ID ${socket.id}`)
  })

  //criar desafio
  socket.on("create-challenge", (data) => {
    const { challengerId, opponentId, type } = data

    let chosenOpponentId = opponentId
    if(!opponentId) {
      
      const availableOpponents = Object.keys(onlineUsers).filter(
        (id) => id !== challengerId
      )

      if(availableOpponents.length === 0){
        return socket.emit("no-opponent-available")
      }

      chosenOpponentId = availableOpponents[Math.floor(Math.random() * availableOpponents.length)]
    }

    const opponentSocketId = onlineUsers[chosenOpponentId]
    if(opponentSocketId){
      const challengeData = {
        challengerId,
        opponentId: chosenOpponentId,
        type
      }

      io.to(opponentSocketId).emit("challenge-received" , challengeData)
    }
  })

  //Responder o desafio
  socket.on("respond-challenge", (data) => {
    const challengerSocketId = onlineUsers[data.challengerId]

    if(challengerSocketId){
      io.to(challengerSocketId).emit("challenge-response", data)
    }

  })

  //Desconectar usuário
  socket.on("disconnect", () => {
    const disconnectedUserId = Object.keys(onlineUsers).find(
      (key) => onlineUsers[key] === socket.id
    )
    if(disconnectedUserId){
      delete onlineUsers[disconnectedUserId]
      console.log(`Usuário ${disconnectedUserId} desconectado.`)
    }
  })

})

//Startar servidor
const startServer = async () => {
  try {
    await connectDB();
    console.log("Conectado ao Servidor.");
    // Inicia o servidor depois da conexão com o banco de dados

    //define onde os arquivos estáticos vão ficar (public)
    app.use(express.static(path.join(__dirname, "public")));
    //define a pasta(public) como local onde os templates HTML estao armazenados(faz o express entender que os arquivos são .html)
    app.set("views", path.join(__dirname, "public", "Pasta HTML"));
    //configura o ejs
    app.engine("html", require("ejs").renderFile);
    //Define o motor dos templates padrão como html, processada pelo ejs
    app.set("view engine", "html");

    //Public Route - Open Route
    app.get("/", (req, res) => {
      res.status(200);
      res.render("index");
    });

    //Routes
    app.use("/auth", authRoutes);
    app.use("/user", userRoutes);
    app.use("/challenge", challengeRoutes);

    server.listen(3000, () => {
      console.log("Servidor rodando em http://localhost:3000");
    });
  } catch (err) {
    console.error("Erro ao conectar ao Banco de Dados: ", err);
    process.exit(1);
  }
};

startServer()
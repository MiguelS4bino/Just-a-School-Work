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

//Open Routes
const authRoutes = require("./routes/authRoutes.js");

//Private Routes
const userRoutes = require("./routes/privateRoutes/userRoutes.js");

const app = express();
app.use(express.json()); //configura o express pra conseguir trabalhar com json
app.use(cors()); //habilita o CORS para todas as rotas

const server = require("http").createServer(app);
const io = require("socket.io")(server);

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

    server.listen(3000, () => {
      console.log("Servidor rodando em http://localhost:3000");
    });
  } catch (err) {
    console.error("Erro ao conectar ao Banco de Dados: ", err);
    process.exit(1);
  }
};

startServer()
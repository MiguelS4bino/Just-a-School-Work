//Server

require("dotenv").config();

const chalk = require('chalk')

const express = require("express");
const path = require("path");
const cors = require("cors");

const mongoose = require("mongoose");

//Imports
const connectDB = require("./config/db");
const registerSocketHandlers = require("./serverSide/socket/handlers.js")

//Models
const User = require("./serverSide/models/User.js");
const Challenge = require("./serverSide/models/Challenge.js")
const Folder = require("./serverSide/models/Folder.js")
const Note = require("./serverSide/models/Note.js")

//Open Routes
const authRoutes = require("./routes/authRoutes.js");

//Private Routes
const userRoutes = require("./routes/privateRoutes/userRoutes.js");
const challengeRoutes = require("./routes/privateRoutes/challengeRoutes.js");
const IARoutes = require("./routes/privateRoutes/IARoutes.js");

const app = express();
app.use(express.json({ limit: '50mb' })); //configura o express pra conseguir trabalhar com json e aumenta a capacidade de armazenamento que ele consegue trabalhar
app.use(cors()); //habilita o CORS para todas as rotas

const server = require("http").createServer(app);
const io = require("socket.io")(server);

registerSocketHandlers(io)

//Startar servidor
const startServer = async () => {
  try {
    await connectDB();
    console.log(chalk.green("Conectado ao Servidor."));
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
    app.use("/IA", IARoutes);

    server.listen(3000, () => {
      console.log
        (
          chalk.green.bold('Servidor rodando em: ') +
          chalk.cyan.underline('http://localhost:3000')
        );
    });
  } catch (err) {
    console.error( chalk.red("Erro ao conectar ao Banco de Dados: "), err);
    process.exit(1);
  }
};

startServer()
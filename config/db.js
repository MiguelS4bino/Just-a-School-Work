const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASS;

  try{
    await mongoose
    .connect(
      `mongodb+srv://${dbUser}:${dbPassword}@cluster0.xkapr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    )

    console.log("Conectado ao Banco de Dados.")
  }catch(err){
    console.error("Erro ao conectar ao banco de dados: ", err);
    process.exit(1); // Sai do processo caso a conexão falhe
  }
}

module.exports = connectDB
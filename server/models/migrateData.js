const mongoose = require("mongoose");
require("dotenv").config();
const User = require('./User')


const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.xkapr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(async () => {
        console.log('Conectado com sucesso')

        const users = await User.find()

        for(let user of users){
            if (!user.rank) {
                user.rank = 'Non-Rank';
            }
            if (!user.level) {
                user.level = 1;
            }
            if (user.xp === undefined) {
                user.xp = 0;
            }
            if (!user.img) {
                user.img = "https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1";
            }

            await user.save()
            console.log(`Usuário ${user.name} atualizado`)
        }

        console.log('Migração completa')

        mongoose.disconnect()
      })
      .catch(err => {
        console.error('Erro ao conectar ao banco de dados: ', err)
      })


module.exports = mongoose
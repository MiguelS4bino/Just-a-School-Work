const Challenge = require("../models/Challenge");
const onlineUsers = require("./onlineUsers");

function registerSocketHandlers(io) {
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
}

module.exports = registerSocketHandlers;

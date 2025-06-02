const mongoose = require('mongoose');

const chalk = require("chalk")

const Challenge = require("../models/Challenge");
const User = require("../models/User");
const { getSocketByUserId } = require('./socketUtils');

function handleChallengeEvents(io, socket) {
  socket.on("inGame", ({ socketId, userId, matchId }) => {
    console.log("");
    console.log('Socket reconectado com SocketId:', chalk.green(socketId));
    console.log("InGame recebido, informações: ", userId, " ", matchId);

    const targetSocket = io.sockets.sockets.get(socketId);
    if(targetSocket) {
      targetSocket.join(matchId);
    } else {
      console.log(`Socket com ID ${socketId} não encontrado.`);
    }
    listarSocketsNaRoom(io, matchId);
    socket.data.userId = userId;
  })

  socket.on("challenge-response", (response) => {
    const { challengeId, challengerId, opponentId, type, accepted } = response;
    const challengerSocket = getSocketByUserId(io, challengerId)
    const opponentSocket = getSocketByUserId(io, opponentId)

    if (accepted) {
      console.log(
        `O desafio foi aceito entre ${challengerId} e ${opponentId}`
      );
      // Iniciar a partida
      if (challengerSocket) io.to(challengerSocket.id).emit("challenge-accepted", challengeId)
      if (opponentSocket) io.to(opponentSocket.id).emit("challenge-accepted", challengeId)

      console.log("id do desafio: ", challengeId)
      challengeAccepted(challengerId, opponentId, challengeId, type)
    } else {
      console.log(
        `O desafio foi rejeitado entre ${challengerId} e ${opponentId}`
      );

      if (challengerSocket) io.to(challengerSocket.id).emit("challenge-rejected")
      if (opponentSocket) io.to(opponentSocket.id).emit("challenge-rejected",)

      challengeRejected(io, challengerId, opponentId, challengeId)
    }
  });

  socket.on('playerDisconnected', (data) => {
    const userId = data.userId || socket.data.userId; 
    const matchId = data.matchId;

    if (matchId && userId) {
      console.log(`Usuário ${userId} desconectou da sala ${matchId}`);
      playerDisconnected(io, matchId, userId);
    } else {
      console.log("Dados insuficientes para desconexão: ", { matchId, userId });
    }
  })
}

async function challengeAccepted(challengerId, opponentId, challengeId, challengeType) {
    try {
        // Encontre o desafio pelo ID
        const challenge = await Challenge.findById(challengeId);
        
        if (!challenge) {
            throw new Error('Desafio não encontrado');
        }
        
        // Atualize o status para "aceito" e adiciona o tipo do desafio
        challenge.status = 'accepted';
        challenge.createdAt = Date.now()
        challenge.type = challengeType; // Pode ser "friend", "casual" ou "ranked"
        
        // Atualiza o desafio no banco de dados
        await challenge.save();
        
        return challenge; // Retorna o desafio atualizado
    } catch (error) {
        console.error('Erro ao aceitar desafio:', error);
        throw error;
    }
}

async function challengeRejected(io, challengerId, opponentId, challengeId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        console.warn('ID inválido de desafio para rejeição:', challengeId);
        return null;
      }
  
    const challengerSocket = getSocketByUserId(io, challengerId);
    const opponentSocket = getSocketByUserId(io, opponentId);

    if (challengerSocket) challengerSocket.leave(challengeId);
    if (opponentSocket) opponentSocket.leave(challengeId);

      const deletedChallenge = await Challenge.findByIdAndDelete(challengeId);
  
      if (!deletedChallenge) {
        console.warn(`Desafio não encontrado para rejeição, ID: ${challengeId}`);
        return null;
      }
  
      console.log(`Desafio entre ${challengerId} e ${opponentId} rejeitado e removido.`);
      return deletedChallenge;
    } catch (error) {
      console.error('Erro ao rejeitar desafio:', error);
      // Dependendo da lógica, aqui pode lançar ou apenas retornar null
      throw error;
    }
}

//utils
async function listarSocketsNaRoom(io, roomName) {
  try {
    const sockets = await io.in(roomName).fetchSockets();
    const socketIds = sockets.map(socket => socket.id);
    console.log(`Sockets na room ${chalk.green(roomName)}: `, chalk.green(socketIds));
  } catch (err) {
    console.error('Erro ao buscar sockets da room:', err);
  }
}
//match
async function playerDisconnected(io, challengeId, playerId){
  try{
    const challenge = await Challenge.findById(challengeId);

    if(!challenge){
      console.log("Desafio não encontrado.");
      return;
    }
    if(challenge.status === 'finished'){
      console.log("Desafio já finalizado.");
      return;
    }

    console.log(`Jogador ${playerId} desconectado da partida ${challengeId}`);

    let winner;
    if(challenge.challenger.toString() === playerId){
      winner = challenge.opponent;
    } else if (challenge.opponent.toString() === playerId){
      winner = challenge.challenger;
    } else {
      console.log("Jogador não pertence ao desafio.");
      return
    }

    challenge.status = 'finished';
    challenge.winner = winner;
    challenge.finishedAt = new Date();

    await challenge.save();

    io.to(challengeId).emit('matchEndedByDisconnection', {
      winner,
      disconnectedPlayer: playerId
    });

    // Força saída dos sockets da sala
    const challengerSocket = getSocketByUserId(io, challenge.challenger.toString());
    const opponentSocket = getSocketByUserId(io, challenge.opponent.toString());

    if (challengerSocket) challengerSocket.leave(challengeId);
    if (opponentSocket) opponentSocket.leave(challengeId);

    console.log('Partida finalizada por desconexão, vencedor: ', winner);
  } catch (err){
    console.error('Erro ao finalizar partida:', err);
  }
}




module.exports = { handleChallengeEvents, challengeAccepted, challengeRejected };

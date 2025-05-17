const mongoose = require('mongoose');

const chalk = require("chalk")

const Challenge = require("../models/Challenge");
const User = require("../models/User");
const { getSocketByUserId } = require('./socketUtils');

function handleChallengeEvents(io, socket) {
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
      console.log('É um ObjectId válido?', require('mongoose').Types.ObjectId.isValid(challengeId))
      challengeAccepted(challengerId, opponentId, challengeId, type)
    } else {
      console.log(
        `O desafio foi rejeitado entre ${challengerId} e ${opponentId}`
      );

      if (challengerSocket) io.to(challengerSocket.id).emit("challenge-rejected")
      if (opponentSocket) io.to(opponentSocket.id).emit("challenge-rejected",)

      challengeRejected(challengerId, opponentId, challengeId)
    }
  });
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
        
        console.log(`Desafio aceito entre ${challengerId} e ${opponentId}`);
        return challenge; // Retorna o desafio atualizado
    } catch (error) {
        console.error('Erro ao aceitar desafio:', error);
        throw error;
    }
}

async function challengeRejected(challengerId, opponentId, challengeId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        console.warn('ID inválido de desafio para rejeição:', challengeId);
        return null;
      }
  
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

module.exports = { handleChallengeEvents, challengeAccepted, challengeRejected };

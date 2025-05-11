const Challenge = require("../models/Challenge");
const User = require("../models/User.js")
const availableForMatchmaking = {};

function registerSocketHandlers(io) {
  //Desafios
  io.on("connection", (socket) => {
    // Resposta ao desafio(para friendly-matches)
    socket.on("challenge-response", (response) => {
      const { challengeId, challengerId, opponentId, type, accepted } = response;
      const challengerSocket = [...io.sockets.sockets.values()].find(
        s => s.data.userId === challengerId
      );
      const opponentSocket = [...io.sockets.sockets.values()].find(
        s => s.data.userId === opponentId
      );


      console.log("Ouviu a response, challengeId: ", challengeId)

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
  })

  //User/Matchmaking
  io.on("connection", (socket) => {
    console.log("Novo usuário conectado:", socket.id);
    
    socket.on("onlineUser", (userId) => {
      if (!userId) {
        console.error("userId inválido");
        return;
      }
    
      socket.data.userId = userId;
      console.log(`Usuário ${userId} registrado com socket ID ${socket.id}`);
    });

    // Marcar usuário como disponível para matchmaking e tentar match
    socket.on("registeredOnMatchmaking", (data) => {
      const { userId, matchmakingType } = data;

      if(socket.data.userId !== userId){
        console.error('Tentativa de registrar matchmaking com ID diferente do socket')
        return
      }

      if (!userId || !matchmakingType) {
        console.error('Dados inválidos para matchmaking', data);
        return;
      }

      console.log("Fila de matchmaking antes do registro:", availableForMatchmaking);
      availableForMatchmaking[userId] = matchmakingType;
      console.log(`Usuário ${userId} registrado no matchmaking do tipo ${matchmakingType}`)
      console.log("Fila de matchmaking após registro:", availableForMatchmaking);

      try {
        findOpponent(io, userId, matchmakingType);
      } catch (error) {
        console.error(`Erro ao registrar o usuário ${userId} para o matchmaking:`, error);
        socket.emit("error","Erro ao registrar no matchmaking. Tente novamente mais tarde.");
      }
    });

    // Remover usuário do matchmaking manualmente
    socket.on("disconnectedOfMatchmaking", (data) => {
      console.log("Evento 'disconnectedOfMatchmaking' recebido:", data); // Log para depuração
      const { userId } = data;
    
      if (userId) {
        if (availableForMatchmaking[userId]) {
          delete availableForMatchmaking[userId];
          console.log(`Usuário ${userId} removido do matchmaking.`);
        } else {
          console.log(`Usuário ${userId} não estava na fila de matchmaking.`);
        }
      } else {
        console.error("userId não foi fornecido.");
      }
    });

    // Remover usuário manualmente da lista online
    socket.on("disconnectOnline", () => {
      const userId = Object.keys(onlineUsers).find(
        (key) => onlineUsers[key] === socket.id
      );
      if (userId) {
        delete onlineUsers[userId];
        delete availableForMatchmaking[userId];
        console.log(`Usuário ${userId} removido manualmente da lista online.`);
      }
    });

    // Quando o socket desconecta automaticamente
    socket.on("disconnect", () => {
      const userId = socket.data.userId;

      if (userId) {
        delete availableForMatchmaking[userId];
        console.log(`Usuário ${userId} desconectado (socket encerrado).`);
      }
    });
  });
}

async function findOpponent(io, userId, matchmakingType) {
  if (!matchmakingType || !["casual", "ranked"].includes(matchmakingType)) {
    console.log(`Tipo de matchmaking inválido para o usuário ${userId}.`);
    return;
  }

  console.log("Fila de matchmaking:", availableForMatchmaking);

  const availableOpponents = Object.keys(availableForMatchmaking).filter(
    (id) => id !== userId && availableForMatchmaking[id] === matchmakingType
  );
  console.log("Oponentes filtrados:", availableOpponents);

  if (availableOpponents.length === 0) {
    console.log(
      `Sem oponentes disponíveis para o usuário ${userId}. Aguardando...`
    );
    return;
  }

  console.log(`Oponentes disponíveis para o usuário ${userId}:`, availableOpponents)

  const chosenOpponentId =
    availableOpponents[Math.floor(Math.random() * availableOpponents.length)];

  // Criar desafio
  try{
    await createChallenge(io, userId, chosenOpponentId, matchmakingType);
  } catch(err){
    console.log({ msg: err.message })
  }
}

async function createChallenge(io, challengerId, opponentId, type) {
  const opponentSocket = [...io.sockets.sockets.values()].find(
    s => s.data.userId === opponentId
  );

  const challengerSocket = [...io.sockets.sockets.values()].find(
    s => s.data.userId === challengerId
  );

  console.log(`Procurando oponente: ${opponentId}, online: ${opponentSocket ? opponentSocket.id : 'não encontrado'}`);

  if (opponentSocket) {
    console.log('Socket do oponente encontrado: ', opponentSocket.id);

    try {
      const challengerUser = await User.findById(challengerId);
      const challengerNickname = challengerUser?.nickname || "Desafiante";

      const challenge = await Challenge.create({
        challenger: challengerId,
        opponent: opponentId,
        type: type,
        status: "pending", // status inicial
      });

      console.log("ChallengeId antes de o mandar no ChallengeData: ", challenge._id)
      const challengeId = (challenge._id).toString()

      const challengeData = {
        challengeId,
        challengerId,
        opponentId,
        type,
        challengerNickname,
      };

      console.log("objeto challengeData: ", challengeData)

      try {
        io.to(opponentSocket.id).emit("challenge-received", challengeData);
      } catch (err) {
        console.log('Erro ao enviar desafio via socket:', err.message);
      }

      console.log(`Desafio salvo e emitido entre ${challengerId} e ${opponentId} do tipo ${type}`);

      // Remove os dois da fila
      delete availableForMatchmaking[challengerId];
      delete availableForMatchmaking[opponentId];
    } catch (error) {
      console.error("Erro ao criar ou emitir desafio:", error);
    }
  } else {
    console.log(`Oponente ${opponentId} não está mais online. Retirando da fila.`);
    delete availableForMatchmaking[opponentId];
  }
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
    // Encontre e remova o desafio diretamente
    const deletedChallenge = await Challenge.findByIdAndDelete(challengeId);

    if (!deletedChallenge) {
      throw new Error('Desafio não encontrado');
    }

    console.log(`Desafio entre ${challengerId} e ${opponentId} foi rejeitado e removido do banco.`);
    return deletedChallenge;
  } catch (error) {
    console.error('Erro ao rejeitar desafio:', error);
    throw error;
  }
}

module.exports = registerSocketHandlers;

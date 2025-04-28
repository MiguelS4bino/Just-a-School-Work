const Challenge = require("../models/Challenge");
const onlineUsers = {}; // { userId: socketId }
const availableForMatchmaking = {};

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("Novo usuário conectado:", socket.id);

    // Registrar usuário como online
    socket.on("register", (userId) => {
      onlineUsers[userId] = socket.id;
      console.log(`Usuário ${userId} registrado com socket ID ${socket.id}`);
    });

    // Marcar usuário como disponível para matchmaking e tentar match
    socket.on("registeredOnMatchmaking", (data) => {
      const { userId, matchmakingType } = data;

      if (!userId || !matchmakingType) {
        console.error('Dados inválidos para matchmaking', data);
        return;
      }

      availableForMatchmaking[userId] = matchmakingType;
      console.log(
        `Usuário ${userId} registrado no matchmaking do tipo ${matchmakingType}`
      );

      try {
        findOpponent(userId, matchmakingType);
      } catch (error) {
        console.error(
          `Erro ao registrar o usuário ${userId} para o matchmaking:`,
          error
        );
        socket.emit(
          "error",
          "Erro ao registrar no matchmaking. Tente novamente mais tarde."
        );
      }
    });

    // Resposta ao desafio
    socket.on("challenge-response", (response) => {
      const { challengerId, opponentId, accepted } = response;

      if (accepted) {
        console.log(
          `O desafio foi aceito entre ${challengerId} e ${opponentId}`
        );
        // Iniciar a partida
      } else {
        console.log(
          `O desafio foi rejeitado entre ${challengerId} e ${opponentId}`
        );
        // Reiniciar a busca por oponentes
        findOpponent(challengerId, availableForMatchmaking[challengerId]);
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
      const userId = Object.keys(onlineUsers).find(
        (key) => onlineUsers[key] === socket.id
      );
      if (userId) {
        delete onlineUsers[userId];
        delete availableForMatchmaking[userId];
        console.log(`Usuário ${userId} desconectado (socket encerrado).`);
      }
    });
  });
}

function findOpponent(userId, matchmakingType) {
  if (!matchmakingType || !["casual", "ranked"].includes(matchmakingType)) {
    console.log(`Tipo de matchmaking inválido para o usuário ${userId}.`);
    return;
  }

  const availableOpponents = Object.keys(availableForMatchmaking).filter(
    (id) => id !== userId && availableForMatchmaking[id] === matchmakingType
  );

  if (availableOpponents.length === 0) {
    console.log(
      `Sem oponentes disponíveis para o usuário ${userId}. Aguardando...`
    );
    return;
  }

  const chosenOpponentId =
    availableOpponents[Math.floor(Math.random() * availableOpponents.length)];

  // Criar desafio
  createChallenge(userId, chosenOpponentId, matchmakingType);
}

function createChallenge(challengerId, opponentId, type) {
  const opponentSocketId = onlineUsers[opponentId];

  if (opponentSocketId) {
    const challengeData = {
      challengerId,
      opponentId,
      type,
    };
    io.to(opponentSocketId).emit("challenge-received", challengeData);
    console.log(
      `Desafio criado entre ${challengerId} e ${opponentId} do tipo ${type}`
    );

    // Remover ambos os jogadores da fila de matchmaking
    delete availableForMatchmaking[challengerId];
    delete availableForMatchmaking[opponentId];
  } else {
    console.log(
      `Oponente ${opponentId} não está mais online. Retirando da fila.`
    );
    delete availableForMatchmaking[opponentId];
  }
}

module.exports = registerSocketHandlers;

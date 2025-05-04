const Challenge = require("../models/Challenge");
const User = require("../models/User.js")
const availableForMatchmaking = {};

function registerSocketHandlers(io) {
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

    // Resposta ao desafio(para friendly-matches)
    socket.on("challenge-response", (response) => {
      const { challengerId, opponentId, accepted } = response;
      const challengerSocket = [...io.sockets.sockets.values()].find(
        s => s.data.userId === challengerId
      );
      const opponentSocket = [...io.sockets.sockets.values()].find(
        s => s.data.userId === opponentId
      );

      if (accepted) {
        console.log(
          `O desafio foi aceito entre ${challengerId} e ${opponentId}`
        );
        // Iniciar a partida
        if (challengerSocket) io.to(challengerSocket.id).emit("challenge-accepted")
        if (opponentSocket) io.to(opponentSocket.id).emit("challenge-accepted")
      } else {
        console.log(
          `O desafio foi rejeitado entre ${challengerId} e ${opponentId}`
        );
        // Reiniciar a busca por oponentes
        //findOpponent(challengerId, availableForMatchmaking[challengerId]);
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
    console.log('Socket do oponente encontrado: ', opponentSocket.id)
    try {
      const challengerUser = await User.findById(challengerId);
      const challengerNickname = challengerUser?.nickname || "Desafiante";

      const challengeData = {
        challengerId,
        opponentId,
        type,
        challengerNickname,
      };

      try{
        io.to(opponentSocket.id).emit("challenge-received", challengeData);
      } catch(err){
        console.log('disse que erra nessa porra', err.message)
      }
      //io.to(challengerSocket.id).emit("challenge-received", challengeData)
      console.log(`Desafio em espera entre ${challengerId} e ${opponentId} do tipo ${type}`);

      // Remover ambos os jogadores da fila
      delete availableForMatchmaking[challengerId];
      delete availableForMatchmaking[opponentId];
    } catch (error) {
      console.error("Erro ao buscar nickname do desafiante:", error);
    }
  } else {
    console.log(`Oponente ${opponentId} não está mais online. Retirando da fila.`);
    delete availableForMatchmaking[opponentId];
  }
}

module.exports = registerSocketHandlers;

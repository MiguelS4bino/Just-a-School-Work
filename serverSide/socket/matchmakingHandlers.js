const chalk = require("chalk")

const User = require("../models/User");
const Challenge = require("../models/Challenge");

const availableForMatchmaking = {};
const onlineUsers = {};

const EventEmitter = require('events');
const matchmakingEvents = new EventEmitter();

function handleMatchmakingEvents(io, socket) {
  
  socket.on("onlineUser", (userId) => {
    if (!userId) {
      console.error("userId inválido");
      return;
    }
    socket.data.userId = userId;
    onlineUsers[userId] = socket.id
    console.log(`Usuário ${chalk.green(userId)} online com socket ID ${chalk.green(socket.id)}`);
  });

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
    availableForMatchmaking[userId] = matchmakingType;
    console.log(`Usuário ${userId} registrado no matchmaking do tipo ${matchmakingType}`);
    console.log("Fila de matchmaking:", availableForMatchmaking);

    // Emite evento para tentar casar pares
    matchmakingEvents.emit('queueUpdated', io);
  });

  socket.on("disconnectedOfMatchmaking", (data) => {
    const { userId } = data;
    if (userId && availableForMatchmaking[userId]) {
      delete availableForMatchmaking[userId];
      console.log(`Usuário ${userId} removido do matchmaking.`);
      matchmakingEvents.emit('queueUpdated', io);
    }
  });

  socket.on("userLogout", (userId) => {
    if (userId) {
      delete onlineUsers[userId];
      delete availableForMatchmaking[userId];
      console.log(chalk.yellow(`Usuário ${chalk.bold(userId.userId)} removido da lista online.`));
      matchmakingEvents.emit('queueUpdated', io);
    } else {
      console.error("userLogout recebido sem userId.");
    }
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (userId) {
      delete availableForMatchmaking[userId];
      console.log(chalk.yellow(`Usuário ${chalk.bold(userId)} desconectado (socket encerrado).`));
      matchmakingEvents.emit('queueUpdated', io);
    }
  });

}

// Função para casar pares de jogadores
async function tryMatchmaking(io) {
  const usersInQueue = Object.keys(availableForMatchmaking);

  // Mantém lista para já processados nesta rodada
  const processed = new Set();

  for (const userId of usersInQueue) {
    if (processed.has(userId)) continue;

    const matchmakingType = availableForMatchmaking[userId];
    if (!matchmakingType) continue;

    // Busca oponente que não foi processado ainda e tenha o mesmo tipo
    const opponentId = usersInQueue.find(id =>
      id !== userId &&
      !processed.has(id) &&
      availableForMatchmaking[id] === matchmakingType
    );

    if (opponentId) {
      try {
        await createChallenge(io, userId, opponentId, matchmakingType);
        // Remove da fila
        delete availableForMatchmaking[userId];
        delete availableForMatchmaking[opponentId];

        processed.add(userId);
        processed.add(opponentId);

        console.log(`Matchmaking concluído entre ${userId} e ${opponentId}`);
      } catch (error) {
        console.error("Erro ao criar desafio no matchmaking:", error);
      }
    }
  }
}

// Escuta evento para rodar matchmaking
matchmakingEvents.on('queueUpdated', (io) => {
  tryMatchmaking(io);
});

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
        status: "pending",
      });

      const challengeId = (challenge._id).toString()

      const challengeData = {
        challengeId,
        challengerId,
        opponentId,
        type,
        challengerNickname,
      };

      io.to(opponentSocket.id).emit("challenge-received", challengeData);

      console.log(`Desafio salvo e emitido entre ${challengerId} e ${opponentId} do tipo ${type}`);

    } catch (error) {
      console.error(chalk.red("Erro ao criar ou emitir desafio:", error));
      throw error;
    }
  } else {
    console.log(chalk.yellow(`Oponente ${chalk.bold(opponentId)} não está mais online. Retirando da fila.`));
    delete availableForMatchmaking[opponentId];
  }
}


module.exports = { handleMatchmakingEvents, createChallenge, availableForMatchmaking };

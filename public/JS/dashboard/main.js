const socket = io();  // Conecta-se ao servidor Socket.IO

function getCurrentUserId() {
  return localStorage.getItem('userId')
}

function isSocketConnected() {
  return socket.connected && getCurrentUserId();
}

//Conectar o usuario no Socket
document.addEventListener('DOMContentLoaded', () => {
  const btnSair = document.getElementById('btn-Sair')

  // Botão de sair
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault()
      logout()
    })
  }

  socket.on("challenge-accepted", () => {
    console.log("Desafio aceito!")
    window.location.href = "../Pasta HTML/partida.html"
  })

  socket.on("challenge-received", (challengeData) => {
    console.log("[Socket] Desafio recebido:", challengeData);
    const { challengerId, opponentId, type, challengerNickname } = challengeData;
  
    // Exibir uma notificação ou modal com as informações do desafio
    showChallengeModal(challengerNickname, type, challengerId, opponentId)
  })

  // Registrar usuário após conexão do socket
  socket.on("connect", () => {
    console.log("[Socket] Conectado ao servidor:", socket.id);
    const userId = getCurrentUserId();
    if (userId) {
      socket.emit("onlineUser", userId);
      socket.data = { userId }; // apenas para debug
      window.socketReady = true;
    }    
  });  
})

const btnCasualMatch = document.getElementById('btnCasual')
btnCasualMatch.addEventListener("click", () => {
  if (!window.socketReady) {
    alert("Aguarde a conexão com o servidor...");
    return;
  }
  enterMatchmaking("casual");
});

const btnRankedMatch = document.getElementById('btnRanked')
btnRankedMatch.addEventListener("click", () => {
  if (!window.socketReady) {
    alert("Aguarde a conexão com o servidor...");
    return;
  }
  enterMatchmaking("ranked");
});

let isSearching = false;

const btnCancelMatchmaking = document.getElementById('cancelMatchmaking')
if (btnCancelMatchmaking) {
  
  btnCancelMatchmaking.addEventListener('click', () => {
    cancelMatchmaking()
  })
}

function enterMatchmaking(typeOfMatch){ 
  const matchmakingModal = document.getElementById('matchmakingModal')
  
    if (!isSocketConnected()) {
      console.warn('Socket não conectado.')
      socket.emit('disconnectedOfMatchmaking', getCurrentUserId())
      return
    }

    isSearching = true
    matchmakingModal.classList.remove('hidden')

    socket.emit('registeredOnMatchmaking', { userId: getCurrentUserId(), matchmakingType: typeOfMatch })
    console.log(`Usuário na fila para o matchmaking de partida ${typeOfMatch}:`, getCurrentUserId())
  
}

// Função para cancelar o matchmaking
function cancelMatchmaking() {
  const matchmakingModal = document.getElementById('matchmakingModal')

    if (isSearching) {
      socket.emit('disconnectedOfMatchmaking', { userId: getCurrentUserId() })
      console.log('Matchmaking cancelado.')
      matchmakingModal.classList.add('hidden')
      isSearching = false
    }
}

function logout() {
  const userId = localStorage.getItem('userId')

  if (userId) {
    socket.emit('userLogout', { userId })
    socket.disconnect()
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    window.location.href = '../Pasta HTML/login.html'
  }
}

window.addEventListener('beforeunload', async () => {
  const userId = localStorage.getItem('userId')
  if (userId && socket.connected) {
    try {
      await new Promise((resolve, reject) => {
        socket.emit('userLogout', { userId }, (response) => {
          if (response.success) resolve()
          else reject('Erro no logout')
        })
      })
      socket.disconnect()
    } catch (err) {
      console.error('Erro no logout antes de fechar a página:', err)
    }
  }
})

function showChallengeModal(challengerNickname, type, challengerId, opponentId) {
  const matchmakingModal = document.getElementById('matchmakingModal')
  const modal = document.getElementById('challengeModal');
  const modalTitle = document.getElementById('challengeModalTitle');
  const acceptBtn = document.getElementById('acceptChallengeBtn');
  const rejectBtn = document.getElementById('rejectChallengeBtn');
  
  matchmakingModal.classList.add('hidden')
  // Atualizar o título com o nome do desafiante e o tipo de partida
  modalTitle.textContent = `${challengerNickname} desafiou você para uma partida ${type === 'casual' ? 'casual' : 'ranqueada'}`;

  // Mostrar a modal
  modal.classList.remove('hidden');

  // Ao aceitar o desafio
  acceptBtn.onclick = () => {
    socket.emit('challenge-response', {
      challengerId,
      opponentId,
      accepted: true,
    });
    modal.classList.add('hidden');  // Fechar a modal após aceitar

    localStorage.setItem('matchInfo', JSON.stringify({ challengerId, opponentId, type }));
    window.location.href = "../Pasta HTML/partida.html"
  };

  // Ao rejeitar o desafio
  rejectBtn.onclick = () => {
    socket.emit('challenge-response', {
      challengerId,
      opponentId,
      accepted: false,
    });
    modal.classList.add('hidden');  // Fechar a modal após rejeitar
  };
}
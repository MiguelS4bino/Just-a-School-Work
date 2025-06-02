const socket = io();  // Conecta-se ao servidor Socket.IO

function getCurrentUserId() {
  return localStorage.getItem('userId')
}

function isSocketConnected() {
  return socket.connected && getCurrentUserId();
}

//Conectar o usuario no Socket
document.addEventListener('DOMContentLoaded', () => {
  const btnSair = document.getElementById('logout-link')

  // Botão de sair
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault()
      logout()
    })
  }

  socket.on("challenge-accepted", (challengeId) => {
    console.log("Desafio aceito!", challengeId);
  
    localStorage.setItem("matchInfo", challengeId);
    localStorage.setItem("userId", getCurrentUserId());
    window.location.href = "../Pasta HTML/match.html";
  });

  socket.on("challenge-rejected", () => {
    console.log("Desafio recusado!")
  })

  socket.on("challenge-received", (challengeData) => {
    const loggedUserId = getCurrentUserId()

    if (challengeData.opponentId === loggedUserId && challengeData.type == "friendly" ) {
      console.log("[Socket] Desafio recebido:", challengeData);
      // Exibir um modal com as informações do desafio
      showChallengeModal(challengeData)
    } else if(challengeData.opponentId === loggedUserId){
      console.log("Redirecionando...")
      socket.emit("challenge-response", {
        challengeId: challengeData.challengeId,
        challengerId: challengeData.challengerId,
        opponentId: challengeData.opponentId,
        type: challengeData.type,
        accepted: true
      });
    }
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
  const modalContent = matchmakingModal.querySelector('div')

    if (!isSocketConnected()) {
      console.warn('Socket não conectado.')
      return
    }

    isSearching = true
    matchmakingModal.classList.remove('hidden')

    // Força o reflow para garantir que a transição ocorra
    void modalContent.offsetWidth

    // Ativa animação de entrada
    modalContent.classList.remove('scale-95', 'opacity-0')
    modalContent.classList.add('scale-100', 'opacity-100')

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
    socket.emit('userLogout', userId)
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

function showChallengeModal(challengeData) {
  console.log("Enviando Desafio: ", challengeData)

  const matchmakingModal = document.getElementById('matchmakingModal');
  const modal = document.getElementById('challengeModal');
  const modalTitle = document.getElementById('challengeModalTitle');
  const acceptBtn = document.getElementById('acceptChallengeBtn');
  const rejectBtn = document.getElementById('rejectChallengeBtn');

  modalTitle.textContent = `${challengeData.challengerNickname} te desafiou para uma partida ${challengeData.type}`;
  modal.classList.remove('hidden');

  if(challengeData.challengeId){
    acceptBtn.onclick = () => {
      console.log("Objeto ao aceitar: ", challengeData)
      socket.emit("challenge-response", {
        challengeId: challengeData.challengeId,
        challengerId: challengeData.challengerId,
        opponentId: challengeData.opponentId,
        type: challengeData.type,
        accepted: true
      });
      modal.classList.add('hidden');
    };
  
    rejectBtn.onclick = () => {
      socket.emit("challenge-response", {
        challengeId: challengeData.challengeId,
        challengerId: challengeData.challengerId,
        opponentId: challengeData.opponentId,
        type: challengeData.type,
        accepted: false
      });
      modal.classList.add('hidden');
    };
  } else {
    console.error('Erro ao ler challengeId: challengeId não encontrado no challengeData');
    throw new Error('challengeId não encontrado no challengeData');
  }

}

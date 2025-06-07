const socket = io();  // Conecta-se ao servidor Socket.IO

function getCurrentUserId() {
  return localStorage.getItem('userId')
}

function isSocketConnected() {
  return socket.connected && getCurrentUserId();
}

//Conectar o usuario no Socket
document.addEventListener('DOMContentLoaded', () => {
  console.log("Inicializando conexão com o servidor...");
  
  const btnSair = document.getElementById('logout-link')

  // Botão de sair
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault()
      logout()
    })
  }

  // Friends Dropdown
  const friendsBtn = document.getElementById('friendsBtn');
  const friendsDropdown = document.getElementById('friendsDropdown');
  const notificationDropdown = document.getElementById('notificationDropdown');
  
  if (friendsBtn && friendsDropdown) {
    friendsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      friendsDropdown.classList.toggle('hidden');
      
      if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
        notificationDropdown.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!friendsDropdown.contains(e.target) && !friendsBtn.contains(e.target)) {
        friendsDropdown.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !friendsDropdown.classList.contains('hidden')) {
        friendsDropdown.classList.add('hidden');
      }
    });

    // Challenge Buttons
    const challengeButtons = friendsDropdown.querySelectorAll('.fa-gamepad');
    challengeButtons.forEach(button => {
      button.parentElement.addEventListener('click', (e) => {
        e.preventDefault();
        const friendName = e.target.closest('.flex').querySelector('.font-medium').textContent;
        
        showNotification(`Desafio enviado para ${friendName}!`, 'success');
      });
    });
  }

  // Notifications
  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle('hidden');
      
      if (friendsDropdown && !friendsDropdown.classList.contains('hidden')) {
        friendsDropdown.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
        notificationDropdown.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !notificationDropdown.classList.contains('hidden')) {
        notificationDropdown.classList.add('hidden');
      }
    });
  }

  // Photo Upload
  const uploadInput = document.getElementById('uploadInput');
  const fotoUsuario = document.getElementById('foto-usuario');
  
  if (uploadInput && fotoUsuario) {
    uploadInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        if (file.size > 50 * 1024 * 1024) {
          showNotification("Imagem muito grande!", 'error');
          this.value = "";
          return;
        }

        fotoUsuario.style.opacity = '0.5';
        const loadingIcon = document.createElement('i');
        loadingIcon.className = 'fas fa-spinner fa-spin absolute inset-0 m-auto text-2xl text-white';
        fotoUsuario.parentElement.appendChild(loadingIcon);
        
        const reader = new FileReader();
        reader.onload = function(e) {
          setTimeout(() => {
            fotoUsuario.src = e.target.result;
            fotoUsuario.style.opacity = '1';
            loadingIcon.remove();
            fotoUsuario.classList.add('animate-scale');
            setTimeout(() => fotoUsuario.classList.remove('animate-scale'), 300);
          }, 1000);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Socket Events
  socket.on("connect", () => {
    console.log("[Socket] Conectado ao servidor:", socket.id);
    const userId = getCurrentUserId();
    if (userId) {
      socket.emit("onlineUser", userId);
      socket.data = { userId }; // apenas para debug
      window.socketReady = true;
      console.log("[Socket] Usuário registrado:", userId);
    }    
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Desconectado do servidor");
    window.socketReady = false;
  });

  socket.on("error", (error) => {
    console.error("[Socket] Erro na conexão:", error);
    window.socketReady = false;
  });

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
  });

  // Matchmaking Buttons
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

  // Botão Jogar Agora
  document.getElementById('btnEntrar')?.addEventListener('click', () => {
    if (!window.socketReady) {
      alert("Aguarde a conexão com o servidor...");
      return;
    }
    enterMatchmaking("casual");
  });

  // Botão Cancelar Matchmaking
  document.getElementById('cancelMatchmaking')?.addEventListener('click', () => {
    hideMatchmakingModal();
    cancelMatchmaking();
  });

  // Tecla ESC para cancelar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !matchmakingModal.classList.contains('hidden')) {
      hideMatchmakingModal();
      cancelMatchmaking();
    }
  });

  // Matchmaking Modal
  const matchmakingModal = document.getElementById('matchmakingModal');
  const modalContent = matchmakingModal.querySelector('div');
  const searchingText = document.getElementById('searchingText');
  const searchTexts = [
    'Procurando jogadores próximos ao seu nível...',
    'Analisando partidas compatíveis...',
    'Verificando conexões disponíveis...',
    'Preparando o desafio perfeito...'
  ];
  let searchTextIndex = 0;
  let searchingInterval;

  function showMatchmakingModal() {
    const matchmakingModal = document.getElementById('matchmakingModal');
    const modalContent = matchmakingModal.querySelector('div');

    // Remove a classe hidden do modal
    matchmakingModal.classList.remove('hidden');
    
    // Força um reflow para garantir que a transição funcione
    void matchmakingModal.offsetHeight;
    
    // Remove as classes de escala e opacidade para mostrar o modal com animação
    modalContent.classList.remove('scale-95', 'opacity-0');
    modalContent.classList.add('scale-100', 'opacity-100');
    
    // Inicia a animação do texto
    startSearchingAnimation();
  }

  function hideMatchmakingModal() {
    const matchmakingModal = document.getElementById('matchmakingModal');
    const modalContent = matchmakingModal.querySelector('div');

    // Adiciona as classes de escala e opacidade para esconder o modal com animação
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    // Espera a animação terminar antes de esconder o modal
    setTimeout(() => {
      matchmakingModal.classList.add('hidden');
      stopSearchingAnimation();
    }, 300);
  }

  function startSearchingAnimation() {
    const searchingText = document.getElementById('searchingText');
    searchTextIndex = 0;
    
    if (searchingText) {
      searchingInterval = setInterval(() => {
        searchingText.textContent = searchTexts[searchTextIndex];
        searchTextIndex = (searchTextIndex + 1) % searchTexts.length;
      }, 3000);
    }
  }

  function stopSearchingAnimation() {
    if (searchingInterval) {
      clearInterval(searchingInterval);
      searchingInterval = null;
    }
  }

  let isSearching = false;

  function enterMatchmaking(typeOfMatch){ 
    if (!isSocketConnected()) {
      console.warn('Socket não conectado.')
      return
    }

    isSearching = true
    
    // Mostra o modal
    showMatchmakingModal();

    // Inicia o matchmaking no servidor
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
});

// Utility Functions
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transform translate-y-full opacity-0 transition-all duration-300 z-50 ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  } text-white`;
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  requestAnimationFrame(() => {
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
  });
  
  setTimeout(() => {
    notification.style.transform = 'translateY(full)';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

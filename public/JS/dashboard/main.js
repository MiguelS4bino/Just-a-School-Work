import socket from './socket.js'

function getCurrentUserId() {
  return localStorage.getItem('userId')
}

function isSocketConnected() {
  return socket.connected && getCurrentUserId();
}

document.addEventListener('DOMContentLoaded', () => {
  const btnSair = document.getElementById('btn-Sair')

  // Registrar usuário após conexão do socket
  socket.on('connect', () => {
    console.log('[Socket] Conectado ao servidor:', socket.id)
  })
  
  // Botão de sair
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault()
      logout()
    })
  }
})

const btnCasualMatch = document.getElementById('btnCasual')
if (btnCasualMatch) {
  btnCasualMatch.addEventListener('click', () => {
    const typeOfMatch = "casual"
    enterMatchmaking(typeOfMatch)
  })
}
const btnRankedMatch = document.getElementById('btnRanked')
if (btnRankedMatch) {
  btnRankedMatch.addEventListener('click', () => {
    const typeOfMatch = "ranked"
    enterMatchmaking(typeOfMatch)
  })
}

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

import socket from './socket.js'

document.addEventListener('DOMContentLoaded', () => {
  const entrarBtn = document.getElementById('btnEntrar')
  const matchmakingModal = document.getElementById('matchmakingModal')
  const cancelBtn = document.getElementById('cancelMatchmaking')
  const challengeModal = document.getElementById('challengeModal')
  const acceptBtn = document.getElementById('acceptChallenge')
  const declineBtn = document.getElementById('declineChallenge')
  const challengeTypeText = document.getElementById('challengeType')
  const btnSair = document.getElementById('btn-Sair')

  let isSearching = false
  let currentUserId = localStorage.getItem('userId')
  let matchmakingTimeout // Variável do timeout do matchmaking

  // Registrar usuário após conexão do socket
  socket.on('connect', () => {
    console.log('[Socket] Conectado ao servidor:', socket.id)
  })

  // Função que verifica se o socket está conectado e o ID do usuário está disponível
  function isSocketConnected() {
    return socket.connected && currentUserId;
  }

  // Função para cancelar o matchmaking
  function cancelMatchmaking() {
    if (isSearching) {
      socket.emit('cancel-matchmaking', { userId: currentUserId })
      console.log('Matchmaking cancelado.')
      clearTimeout(matchmakingTimeout)
      matchmakingModal.classList.add('hidden')
      isSearching = false
    }
  }

  // Ao clicar no botão de entrar, inicia o matchmaking
  entrarBtn.addEventListener('click', () => {
    if (!isSocketConnected()) {
      console.warn('Socket não conectado.')
      return
    }

    socket.emit('register', currentUserId)
    console.log('Usuário registrado:', currentUserId)
  })

  // Botão de sair
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault()
      logout()
    })
  }
})

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

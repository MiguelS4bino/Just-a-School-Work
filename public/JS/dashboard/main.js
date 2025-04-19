import socket from './socket.js'

function logout() {
  const userId = localStorage.getItem('userId');

  if (userId) {
    socket.emit('userLogout', { userId }); // Envia o evento de logout
    socket.disconnect();  // Encerra a conexão com o socket
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '../Pasta HTML/login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnSair = document.getElementById('btn-Sair');
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault(); // Evita que o link vá pro topo da página
      logout();
    });
  }
});

window.addEventListener('beforeunload', async () => {
  const userId = localStorage.getItem('userId');
  if (userId && socket.connected) {
    try {
      await new Promise((resolve, reject) => {
        socket.emit('userLogout', { userId }, (response) => {
          if (response.success) {
            resolve();
          } else {
            reject('Erro no logout');
          }
        });
      });
      socket.disconnect();
    } catch (err) {
      console.error('Erro no logout antes de fechar a página:', err);
    }
    socket.disconnect();
  }
});

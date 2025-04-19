const socket = io();  // Conecta-se ao servidor Socket.IO

socket.on('connect', () => {
    console.log('[Socket] Conectado ao servidor:', socket.id);
  });


export default socket; // Exporta o socket para que possa ser importado no main.js
// socket.js




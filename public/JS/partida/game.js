const apiUrl = 'http://localhost:3000';

function getCurrentUserId() {
  return localStorage.getItem('userId')
}

function isSocketConnected() {
  return socket.connected && getCurrentUserId();
}

export default class Game {
  constructor(socket, userId, matchId) {
    this.socket = socket;
    this.userId = userId;
    this.matchId = matchId;

    window.addEventListener('beforeunload', () => {
      this.disconnectPlayerbyDesconnect();
    });
  }

  disconnectPlayerbyDesconnect() {
    const userIdOnUnload = getCurrentUserId();
    this.socket.emit("playerDisconnected", {
      matchId: this.matchId,
      userId: userIdOnUnload
    });
  }
}





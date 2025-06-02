function getSocketByUserId(io, userId) {
    return [...io.sockets.sockets.values()].find(s => s.data.userId === userId);
  }
  
module.exports = { getSocketByUserId };
  
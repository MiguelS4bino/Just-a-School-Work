const EventEmitter = require('events');
const chalk = require('chalk')

const Challenge = require("../models/Challenge.js");
const User = require("../models/User.js")
const { handleChallengeEvents } = require('./challengeHandlers.js')
const { handleMatchmakingEvents } = require('./matchmakingHandlers.js')

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {

    handleChallengeEvents(io, socket)
    handleMatchmakingEvents(io, socket)

  });
}

module.exports = registerSocketHandlers;

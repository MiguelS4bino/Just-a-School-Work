const express = require('express')
const router = express.Router()
const {
    createChallenge,
    getPendingChallenges,
    respondToChallenge
} = require('../../server/controllers/challengeController.js')

//criar novo desafio
router.post('/', createChallenge)

//buscar desafios pendentes
router.get('/pending/:userid', getPendingChallenges)

//Reponder a desafio(aceitar ou rejeitar)
router.patch('/:challengeId/respond', respondToChallenge)

module.exports= router
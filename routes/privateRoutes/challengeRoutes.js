const express = require('express')
const Challenge = require('../../serverSide/models/Challenge')
const checkToken = require('../../config/auth')

const router = express.Router()

router.get('/:id', checkToken, async (req, res) => {
    const id = req.params.id
    
    //check if challenge exists
    const challenge = await Challenge.findById(id)
    if(!challenge){
        return res.status(404).json({ msg: 'Desafio não encontrado' })
    }

    res.status(200).json({ challenge })
})

//match
router.post('/:id/finishGameByDisconnection', async (req, res) => {
    const challengeId = req.params.id;
    const { playerId } = req.body;

    try{
        const challenge = await Challenge.findById(challengeId);

        if(!challenge){
            return res.status(404).json({ msg: 'Desafio não encontrado.' });
        }

        if(challenge.status == 'finished'){
            return res.status(400).json({ msg: 'Desafio já finalizado.' });
        }

        let winner;
        if(challenge.challenger.toString() === playerId){
            winner = challenge.opponent;
        } else if (challenge.opponent.toString() === playerId){
            winner = challenge.challenger;
        } else {
            return res.status(400).json({ msg: 'Jogador não pertence ao desafio.' })
        }

        challenge.status = 'finished';
        challenge.winner = winner;
        challenge.finishedAt = new Date();

        await challenge.save();

        return res.status(200).json({ msg: 'Partida finalizada por desconexão', winner });
    } catch (err){
        console.error(err);
        return res.status(500).json({ msg: 'Erro ao finalizar partida.' })
    }

})

module.exports= router
const Challenge = require("../models/Challenge")

//Create challenge
async function createChallenge(req, res){
    try{
        const { challengerId, opponentId, type } = req.body

        const validTypes = ["friend", "casual", "ranked"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ msg: "Tipo de desafio inválido" });
        }

        const challenge = await Challenge.create({
            challenger: challengerId,
            opponent: opponentId,
            type,
        })

        res.status(201).json(challenge)
    } catch (err){
        res.status(500).json({ msg: 'Erro ao criar desafio', details: err.message })
    }
}

//Searching pending challenges for a user
async function getPendingChallenges(req, res) {
    try{
        const userId = req.params.userId

        const challenges = await Challenge.find({
            opponent: userId,
            status: 'pending'
        }).populate('challenger', 'name surname')

        if (!challenges.length) {
            return res.status(404).json({ msg: "Nenhum desafio pendente encontrado" });
        }

        res.status(200).json(challenges)
    }catch (err) {
        res.status(500).json({ msg: "Erro ao buscar desafios", details: err.message })
    }
}

//Respond Challenge
async function respondToChallenge(req, res){
    try{
        const { challengeId } = req.params
        const { response } = req.body

        if(!["accepted", "rejected"].includes(response)){
            return res.status(400).json({ error: 'Resposta inválida' })
        }
        
        // Verifica se o desafio existe
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: "Desafio não encontrado" });
        }

        const updated = await Challenge.findByIdAndUpdate(
            challengeId,
            { status: response },
            { new: true }
        )

        res.status(200).json(updated)
    }catch (err){
        res.status(500).json({ error: 'Erro ao responder desafio', details: err.message })
    }
}

module.exports = {
    createChallenge,
    getPendingChallenges,
    respondToChallenge
}

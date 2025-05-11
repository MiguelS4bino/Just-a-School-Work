const express = require('express')
const Challenge = require('../../server/models/Challenge')
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

module.exports= router
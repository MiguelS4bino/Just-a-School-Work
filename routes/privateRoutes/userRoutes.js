const express = require('express')
const User = require('../../server/models/User')
const checkToken = require('../../config/auth')

const router = express.Router()

//Private Route
router.get('/:id', checkToken, async (req, res) => {
    const id = req.params.id

    //check if user exists
    const user = await User.findById(id, '-password')

    if(!user){
        return res.status(404).json({ msg: 'Usuário não encontrado' })
    }

    res.status(200).json({ user })
})

//photoUpload
router.post('/photo/:id', checkToken, async(req, res) => {
    const { base64Img } = req.body
    const id = req.params.id

    if(!base64Img){
        return res.status(400).json({ msg: 'Imagem não enviada' })
    }

    

    try{
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        const updatedUser = await User.findByIdAndUpdate(id, {
            img: base64Img
        }, {new: true})

        res.status(200).json({ msg: 'Imagem atualizada', updatedUser })
    } catch(err){
        res.status(500).json({ msg: 'Erro ao atualizar imagem', error: err.message})
    }
})

module.exports = router;

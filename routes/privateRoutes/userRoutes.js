const express = require('express')
const User = require('../../serverSide/models/User')
const checkToken = require('../../config/auth')

const Note = require('../../serverSide/models/Note');
const Folder = require('../../serverSide/models/Folder');

const bcrypt = require("bcrypt");

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

// Atualizar nome e email
router.put("/:id/nameAndEmailUpdate", checkToken, async (req, res) => {
    const { nickname, email } = req.body;
    const userId = req.params.id;

    if (!nickname || !email) {
        return res.status(422).json({ msg: "Nome e email são obrigatórios!" });
    }

    try {
        // Verifica se outro usuário já usa o mesmo email
        const emailExists = await User.findOne({ email, _id: { $ne: userId } });
        if (emailExists) {
            return res.status(422).json({ msg: "Email já está em uso!" });
        }

        const updatedUser = await User.findByIdAndUpdate(
        userId,
        { nickname, email },
        { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: "Usuário não encontrado!" });
        }

        res.status(200).json({ msg: "Perfil atualizado com sucesso!", user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erro ao atualizar perfil" });
    }
});

// Atualizar senha
router.put("/:id/passwordReset", checkToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    if (!currentPassword || !newPassword) {
        return res.status(422).json({ msg: "Senha atual e nova senha são obrigatórias!" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(422).json({ msg: "Senha atual incorreta!" });
        }

        const salt = await bcrypt.genSalt(12);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = newHashedPassword;

        await user.save();
        res.status(200).json({ msg: "Senha atualizada com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erro ao atualizar senha" });
    }
});

router.delete("/:id", checkToken, async (req, res) => {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) return res.status(422).json({ msg: "Senha é obrigatória!" });

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuário não encontrado!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(422).json({ msg: "Senha incorreta!" });

        // Busca todas as pastas do usuário
        const folders = await Folder.find({ userId });

        // Deleta todas as notes de cada pasta
        for (const folder of folders) {
            await Note.deleteMany({ folderId: folder._id });
        }

        // Deleta todas as pastas do usuário
        await Folder.deleteMany({ userId });

        // Finalmente, deleta o usuário
        await User.findByIdAndDelete(userId);

        res.status(200).json({ msg: "Conta e todos os dados foram deletados com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erro ao deletar usuário" });
    }
})

module.exports = router;

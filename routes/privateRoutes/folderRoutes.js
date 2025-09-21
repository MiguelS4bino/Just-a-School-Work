const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const checkToken = require('../../config/auth')

const Folder = require('../../serverSide/models/Folder');

router.get("/:id/getFolders", checkToken, async (req, res) => {
  try {
    const userId = req.params.id;

    const folders = await Folder.find({ userId: userId }).populate('extractedItems');

    const formattedFolders = folders.map(folder => ({
      id: folder._id,
      title: folder.title || 'Sem título',
      relacionedText: folder.relationedText || '',
      createdAt: folder.createdAt,
      extractedItems: folder.extractedItems.map(note => ({
        id: note._id,
        title: note.title || 'Sem título',
        items: Array.isArray(note.items) ? note.items : [],
        createdAt: note.createdAt,
        type: 'note'
      }))
    }));

    return res.status(200).json({ folders: formattedFolders });
  } catch (err) {
    console.error("Erro ao resgatar pastas do usuário: ", err);
    return res.status(500).json({ erro: "Erro ao resgatar pastas." });
  }
});

router.post("/:userId/createFolder", checkToken, async (req, res) => {
    try{
        const userId = req.params.userId;
        const folderName = req.body.title;

        const folder = new Folder({
            userId,
            title: folderName
        });

        await folder.save();

        console.log("Pasta criada: ", folder)
        return res.status(200).json({ msg: "Pasta criada com sucesso." });
    } catch (err){
        console.error("Erro ao apagar pasta: ", err);
        return res.status(500).json({ msg: "Erro ao deletar pasta." });
    }
})

router.delete("/:folderId/deleteFolder", checkToken, async (req, res) => {
    try{
        const folderId = req.params.folderId;

        const deletedFolder = await Folder.findByIdAndDelete(folderId);

        if(!deletedFolder) return res.status(500).json({ msg: "Pasta não encontrada."});

        console.log("Pasta Apagada.")
        return res.status(200).json({ msg: "Pasta apagada com sucesso." });
    } catch (err){
        console.error("Erro ao apagar pasta: ", err);
        return res.status(500).json({ msg: "Erro ao deletar pasta." });
    }          
})

module.exports = router;
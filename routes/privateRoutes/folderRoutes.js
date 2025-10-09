const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const checkToken = require('../../config/auth')

const Folder = require('../../serverSide/models/Folder');
const Note = require('../../serverSide/models/Note');

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

router.get("/:folderId", checkToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.folderId)
      .populate("extractedItems");

    if (!folder) return res.status(404).json({ error: "Pasta não encontrada" });

    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar pasta" });
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

router.put("/:folderId/rename", checkToken, async(req, res) => {
  const folderId = req.params.folderId;
  const { newTitle } = req.body;

  if (!newTitle || !folderId) {
    return res.status(400).json({ msg: "É necessário informar o novo título e o ID da pasta." });
  }

  try{
    updatedFolder = await Folder.findByIdAndUpdate(
      folderId,
      { title: newTitle },
      { new: true }
    )

    if (!updatedFolder) return res.status(404).json({ msg: "Pasta não encontrada." });

    res.status(200).json({ msg: "Pasta renomeada com sucesso!", folder: updatedFolder });
  } catch (err){
    console.log("Erro ao atualizar pasta: ", err);
    return res.status(500).json({ msg: "Erro ao atualizar pasta." });
  }
  
})

router.delete("/:folderId/deleteFolder", checkToken, async (req, res) => {
    try{
        const folderId = req.params.folderId;

        // Apaga todas as notas da pasta
        await Note.deleteMany({ folder: folderId });

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
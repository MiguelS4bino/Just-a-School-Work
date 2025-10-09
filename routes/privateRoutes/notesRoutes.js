const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const checkToken = require('../../config/auth')

const Note = require('../../serverSide/models/Note');
const Folder = require('../../serverSide/models/Folder');

// Configura armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads/notes');
    
    // Cria a pasta se não existir
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post("/:folderId/createNote", checkToken, async (req, res) => {
    try{
        const folderId = req.params.folderId;
        const noteTitle = req.body.title;
        const noteItems = req.body.items;

        if (!noteTitle || !Array.isArray(noteItems) || noteItems.length === 0) {
            return res.status(400).json({ message: "Título e pelo menos um item são obrigatórios." });
        }

        // Verifica se a pasta existe
        const folderExists = await Folder.findById(folderId);
        if (!folderExists) {
            return res.status(404).json({ message: "Pasta não encontrada." });
        }

        const newNote = new Note({
            folderId,
            title: noteTitle,
            items: noteItems,
        });

        await newNote.save();

        //Atualiza a pasta para incluir a nota
        await Folder.findByIdAndUpdate(
            folderId,
            { $push: { extractedItems: newNote._id } },
            { new: true }
        );

        console.log(`Pasta ${folderId} => Nota adicionada: ${newNote}`);
        return res.status(201).json({ message: "Nota criada com sucesso!", note: newNote });
    } catch (err){
        console.error("Erro ao criar nota: ", err);
        return res.status(500).json({ msg: "Erro ao criar nota." });
    }
})

//Apagar nota
router.delete("/:noteId/delete", checkToken, async(req, res) => {
    const noteId = req.params.noteId;
    if(!noteId){
        return res.status(400).json({ message: "É necessário uma nota para apagar." });
    }
    try{
        const deletedNote = await Note.findByIdAndDelete(noteId);

        if(!deletedNote) return res.status(404).json({ msg: "Nota não encontrada." });

        // Remove a referência da nota na pasta
        await Folder.findByIdAndUpdate(deletedNote.folder, {
            $pull: { extractedItems: deletedNote._id }
        });

        return res.status(200).json({ msg: "Nota apagada com sucesso." });
    }catch(err){
                console.error("Erro ao apagar nota: ", err);
        return res.status(500).json({ msg: "Erro ao apagar nota" })
    }
})

module.exports = router;
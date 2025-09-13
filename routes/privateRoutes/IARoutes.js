const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

//Utils
const saveOrganizedNotes = require("../../serverSide/utils/noteUtils");

const { organizeContent, extractTextfromImage } = require('../../serverSide/models/IAModels/OpenRouterIA');
const readImage = require('../../serverSide/models/IAModels/Tessereract');
const Folder = require('../../serverSide/models/Folder');

const router = express.Router();

// Garante que a pasta exista
const uploadDir = path.join(__dirname, '../../tempUploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

router.post("/:id/extractText", upload.array('imgs'), async (req, res) => {
  try {
    const imgs = req.files;
    const userId = req.params.id;
    if (!imgs || imgs.length === 0) return res.status(400).json({ msg: "Nenhuma imagem enviada." });
    if (!userId) return res.status(400).json({ msg: "Nenhum userId enviado." });

    let extractedText = "";
    for (const img of imgs) {
      const text = await extractTextfromImage(img.path);
      extractedText += `\n${text}`;
      fs.unlinkSync(img.path); // apaga o arquivo após uso
    }

    console.log(extractedText.trim());
    return res.status(200).json({ resumoOrganizado: extractedText.trim() });
  } catch (err) {
    console.error("Erro ao extrair texto:", err);
    return res.status(500).json({ erro: "Erro ao processar imagens." });
  }
});

router.post("/:id/organizeText", async (req, res) => {
  try{
    const userId = req.params.id;
    const text = req.body.prompt;
    if(!userId) return res.status(400).json({ erro: "UserId na requisição é obrigatório!" });
    if(!text) return res.status(400).json({ erro: "Sem texto a ser organizado." });

    const iaResult = await organizeContent(text);
    if(!iaResult) return res.status(500).json({ erro: "Erro ao processar texto(IA)." });

    let inJsonContent;
    try {
      inJsonContent = JSON.parse(iaResult);
    } catch (parseErr) {
      console.error("Erro ao fazer parse do JSON retornado pela IA:", parseErr);
      console.error("Resposta da IA recebida:", iaResult);
      return res.status(500).json({ erro: "Resposta da IA inválida." });
    }
    console.log(inJsonContent);

    const objectSave = await saveOrganizedNotes(userId, inJsonContent, text);
    if(objectSave.success){
      console.log("Notas salvas com sucesso e pasta criada: ", objectSave.folderId);
      return res.status(200).json({ msg: "Notas organizadas e guardadas na aba 'Pastas'." });
    } else {
      console.error("Erro ao salvar notas: ", objectSave.error);
      return res.status(500).json({ error: "Erro ao salvar notas no Banco de Dados"});
    }
  }catch(err){
    console.error("Erro ao organizar texto: ", err);
    return res.status(500).json({ erro: "Erro ao organizar texto." });
  }
})

router.get("/:id/getFolders", async (req, res) => {
  try {
    const userId = req.params.id; // <-- corrigido

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

    console.log(formattedFolders);
    return res.status(200).json({ folders: formattedFolders });
  } catch (err) {
    console.error("Erro ao resgatar pastas do usuário: ", err);
    return res.status(500).json({ erro: "Erro ao resgatar pastas." });
  }
});


module.exports = router;

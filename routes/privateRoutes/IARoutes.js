const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

//Utils
const saveOrganizedNotes = require("../../serverSide/utils/noteUtils");

const { gerarResumo, extractTextfromImage } = require('../../serverSide/models/IAModels/OpenRouterIA');
const detectText = require('../../serverSide/models/IAModels/VisionAi');
const readImage = require('../../serverSide/models/IAModels/Tessereract');

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
      extractedText += `\n\n${text}`;
      fs.unlinkSync(img.path); // apaga o arquivo após uso
    }

    console.log(extractedText.trim());
    
    const prompt= extractedText.trim();
    if (!prompt) return res.status(400).json({ erro: "Sem texto para ser organizado." });

    const resultado = await gerarResumo(prompt);
    if (!resultado) return res.status(500).json({ erro: "Erro ao processar texto." });

    // Converte para JSON real
    const organized = JSON.parse(resultado);
    console.log(organized)

    res.status(200).json({ resumoOrganizado: resultado });
    /*
    // SALVA NO MONGO
    await saveOrganizedNotes(userId, organized);
    console.log("Notas Organizadas e salvas com sucesso!", )
    
    */
  } catch (err) {
    console.error("Erro ao extrair texto:", err);
    res.status(500).json({ erro: "Erro ao processar imagens." });
  }
});

module.exports = router;

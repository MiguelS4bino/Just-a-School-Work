const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const gerarResumo = require('../../serverSide/models/IAModels/OpenRouterIA');
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

router.post("/genText", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ erro: "Texto para organizar é obrigatório." });

  const resultado = await gerarResumo(prompt);
  if (!resultado) return res.status(500).json({ erro: "Erro ao processar texto." });

  res.json({ resumoOrganizado: resultado });
});

router.post("/extractText", upload.array('imgs'), async (req, res) => {
  try {
    const imgs = req.files;
    if (!imgs || imgs.length === 0) return res.status(400).json({ msg: "Nenhuma imagem enviada." });

    let extractedText = "";
    for (const img of imgs) {
      const text = await readImage(img.path);
      extractedText += `\n\n${text}`;
      fs.unlinkSync(img.path); // apaga o arquivo após uso
    }

    res.status(200).json({ finalTextExtraction: extractedText.trim() });
  } catch (err) {
    console.error("Erro ao extrair texto:", err);
    res.status(500).json({ erro: "Erro ao processar imagens." });
  }
});

module.exports = router;

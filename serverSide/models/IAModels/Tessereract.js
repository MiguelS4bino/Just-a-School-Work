const { createWorker } = require('tesseract.js');

async function readImage(imagePath) {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(imagePath);
  await worker.terminate();
  return ret.data.text;
}
/* 
async function readImage(imagePath) {
  try {
    const { data } = await Tesseract.recognize(imagePath, 'por', {
      logger: m => console.log(m)
    });

    const extractText = (items) =>
      items?.map(item => item.text?.trim()).filter(Boolean).join('\n');

    const blocksText = extractText(data.blocks);
    if (blocksText) return blocksText;

    const linesText = extractText(data.lines);
    if (linesText) return linesText;

    return data.text?.trim() || "";
  } catch (error) {
    console.error("Erro ao reconhecer imagem:", error);
    return "";
  }
}
*/
module.exports = readImage;

const Tesseract = require('tesseract.js');
const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function readImage(imagePath){
    const res = await Tesseract.recognize(
        imagePath, 'por', { logger: m => console.log(m) }
    );

    return res.data.text;
}

module.exports = readImage;
//Funcional

const axios = require("axios");
require("dotenv").config();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;

async function gerarResumo(texto) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um assistente que organiza anotações de estudo em tópicos claros e objetivos."
          },
          {
            role: "user",
            content: `${texto}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Retorna o texto gerado pela IA
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Erro na comunicação com OpenRouter:", error.response?.data || error.message);
    return null;
  }
}

module.exports = gerarResumo;
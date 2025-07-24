//Funcional
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;

async function extractTextfromImage(imagePath) {
  const base64image = fs.readFileSync(imagePath).toString("base64");

  try {
    const response = await axios.post(
      API_URL,
      {
        model: "qwen/qwen2.5-vl-32b-instruct:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/png;base64,${base64image}` } },
              { type: "text", text: "Extraia todo o texto visível da imagem. Retorne apenas o texto puro, sem blocos de markdown, sem aspas, sem crases, sem prefixos como 'plaintext'" }
            ]
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
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

async function organizeContent(texto) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "qwen/qwen3-235b-a22b-07-25:free",
        messages: [
          {
            role: "system",
            content: "Você é um assistente que organiza anotações"
          },
          {
            role: "user",
            content: `Aja como um organizador de anotações de estudo.

            Dado o texto abaixo (possivelmente com erros de leitura), corrija pequenos erros de português ou inglês e formate o conteúdo em um JSON com tópicos organizados(A saída DEVE começar com uma chave "{" e terminar com "}". Não adicione NENHUM texto antes ou depois do JSON). Identifique títulos e subtítulos. Responda em PORTUGUÊS BRASILEIRO

            Siga este modelo:

            {
              "title": "Tema Principal",
              "notes": [
                {
                  "title": "Subtópico A",
                  "items": ["explicação clara e objetiva"]
                },
                {
                  "title": "Subtópico B",
                  "items": ["explicação clara e objetiva"]
                }
              ]
            }

            Texto:
            ${texto}`
          }
        ],
        temperature: 0.8,
        max_tokens: 5000,
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

module.exports = { organizeContent , extractTextfromImage};
//NAO FUNCIONAL
const axios = require("axios");
require("dotenv").config()

const HF_TOKEN = process.env.HF_TOKEN;
const API_URL = "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct";

const queryLlama3 = async (prompt) => {
    try{
        const response = await axios.post(
            API_URL, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 200,
                    temperature: 0.2,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`
                },
            }
        );

        const result = response.data;
        return result[0]?.generated_text || "Nenhuma resposta gerada.";
    }catch(err){
        console.error("Erro na consulta ao Llama3: ", err.response?.data || err.message)
        return "Erro na geração de texto."
    }
}   

module.exports = queryLlama3;
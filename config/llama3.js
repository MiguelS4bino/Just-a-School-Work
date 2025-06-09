const axios = require("axios");
require("dotenv").config()

const HF_TOKEN = process.env.HF_TOKEN;
const API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";

const queryLlama3 = async (prompt) => {
    try{
        const response = await axios.post(
            API_URL, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 200,
                    temperature: 0.7,
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
        console.err("Erro na consulta ao Llama3: ", error.response?.data || error.message)
        return "Erro na geração de texto."
    }
}   
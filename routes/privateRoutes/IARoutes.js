const express = require('express')
const User = require('../../serverSide/models/User')
const checkToken = require('../../config/auth')
const queryLlama3 = require("../../config/llama3");

const router = express.Router()

router.post("/genText", checkToken, async (req, res) => {
    const prompt = req.body;
    const output = await queryLlama3(prompt);
    res.json({ resposta: output });
})

module.exports = router;
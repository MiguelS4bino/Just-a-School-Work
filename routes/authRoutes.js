const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../serverSide/models/User");

const router = express.Router();

// User Register
router.post("/register", async (req, res) => {
  const { nickname, email, password, confirm_password } = req.body;

  // Validações
  if (!nickname) {
    return res.status(422).json({ msg: "Nome é obrigatório!" });
  }
  if (!email) {
    return res.status(422).json({ msg: "Email é obrigatório!" });
  }
  if (!password) {
    return res.status(422).json({ msg: "Senha é obrigatória!" });
  }
  if (!confirm_password) {
    return res.status(422).json({ msg: "Confirmação de senha é obrigatória!" });
  }

  if (password !== confirm_password) {
    return res.status(422).json({ msg: "As senhas não conferem!" });
  }

  // Verificar se o usuário já existe
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res
      .status(422)
      .json({ msg: "Usuário já cadastrado! Por favor, utilize outro e-mail." });
  }

  // Criar e criptografar a senha
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Criar o usuário
  const user = new User({
    nickname,
    email,
    password: passwordHash,
  });

  try {
    await user.save();
    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Ocorreu um erro no servidor!" });
  }
});

//User Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  //Validations
  if (!email) {
    res.status(422).json({ msg: "Email é obrigatório1" });
  }
  if (!password) {
    res.status(422).json({ msg: "Senha é obrigatório1" });
  }

  //check if user exist
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  //check if password match
  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida!" });
  }

  try {
    const secret = process.env.SECRET;
    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({
      msg: "Autentificação realizada com sucesso",
      token,
      user: {
        id: user._id,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Aconteceu erro no servidor!" });
  }
});

module.exports = router;

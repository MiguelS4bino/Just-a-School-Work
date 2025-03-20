const jwt = require('jsonwebtoken')

const checkToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]//divide o token e o bearer e captura o token

    if(!token){
        return res.status(401).json({msg: 'Acesso Negado!'})
    }

    try{

        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()

    }catch(err){
        return res.status(400).json({msg: 'Token inválido!'})
    }
}

module.exports(checkToken)
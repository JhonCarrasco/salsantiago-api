const jwt = require('jsonwebtoken')

// ========================================
// VERIFY TOKEN
// ========================================
let verifyToken = (req, res, next) => {
    // obtener el parametro llamado 'authorization' donde viene el valor del token en el header
    let token = req.get('authorization')

    jwt.verify( token, process.env.SEED, (err, decode) => {
        if (err)
            return res.status(401).json({
                ok: false,
                err: {
                    message: 'Token no válido'
                }
            })

        // dentro de decode (payload del token) viene el user
        req.user = decode.user
        next()
    })

}

// ========================================
// VERIFY ADMINROLE
// ========================================
let verifyAdminRole = (req, res, next) => {
    
    let user = req.user

    if ( user.role === 'ADMIN_ROLE') 
        next()
    else
        return res.json({
            ok: false,
            err: {
                message: 'El usuario no es administrador'
            }
        })

}

// ========================================
// VERIFY TOKEN FOR IMAGE
// ========================================
let verifyTokenImage = (req, res, next) => {
    // obtener el parametro llamado 'token' donde viene el valor en la url petición
    // example: {{url}}/image/users/5fcabd18e95c861d68d41c99-299.jpg?token=123456
    let token = req.query.token

    jwt.verify( token, process.env.SEED, (err, decode) => {
        if (err)
            return res.status(401).json({
                ok: false,
                err: {
                    message: 'Token no válido'
                }
            })

        // dentro de decode (payload del token) viene el user
        req.user = decode.user
        next() 
    })

}

module.exports = {
    verifyToken,
    verifyAdminRole,
    verifyTokenImage
}
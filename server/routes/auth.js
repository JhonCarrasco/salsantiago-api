const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const _ = require('underscore')
const {OAuth2Client} = require('google-auth-library')
const User = require('../models/User')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const app = express()

const client = new OAuth2Client(process.env.CLIENT_ID_GOOGLE_WEB)

const signToken = (_id) => {
    return jwt.sign({ _id },
    process.env.SEED,
    { expiresIn: process.env.TOKEN_EXPIRATION})
}

app.post('/login', (req, res) => {

    let body = req.body

    User.findOne({ email: body.email }, (err, userDB) => {

        if (err) 
            return res.status(500).json({
                ok: false,
                err
            })

        if (!userDB) 
            return res.status(400).json({
                ok: false,
                err: {
                    message: '(Usuario) y/o contraseña incorrecto(s)'
                }
            })

        if (!bcrypt.compareSync(body.password, userDB.password))
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario y/o (contraseña) incorrecto(s)'
                }
            })
        
        
        const token = signToken(userDB._id)
        
        res.json({
            ok: true,
            user: userDB,
            token
        })
    })

})// end post

// Check Google user by token
async function verify( token ) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: [process.env.CLIENT_ID_GOOGLE_WEB, 
            process.env.CLIENT_ID_GOOGLE_ANDROID, 
            process.env.CLIENT_ID_GOOGLE_IOS],  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload()
    
    return {
        name: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }
    
  }
//   verify().catch(console.error);

app.post('/google', async (req, res) => {

    // idtoken variable coming from client side
    let token = req.body.idtoken

    // check google user
    let googleUser = await verify( token )
                        .catch(e => {
                            return res.status(403).json({
                                ok: false,
                                err: {
                                    message: 'Error verificar token google'
                                }
                            })
                        })
    
    User.findOne({ email: googleUser.email }, (err, userDB) => {
        
        if (err) 
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'Error google findOne'
                }
            })
        
        if (!userDB) 
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no existe'
                }
            })
 
        // user exits but not by google sign-in or have change metadata
        if (userDB.google === false 
            || userDB.displayName !== googleUser.name
            || userDB.googleImg !== googleUser.img
            ) {
            //Update user
            const googleChange = {
                displayName: googleUser.name,
                google: true,
                googleImg: googleUser.img
            }
    
            User.findByIdAndUpdate( {_id: userDB._id}, googleChange,        
                { new: true
                , runValidators: true 
                , context: 'query'
                }, (err, newUser) => {
    
                if (err) 
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message:'No actualizado'
                        }
                    })
    
                const token = signToken(newUser._id)
    
                return res.json({
                    ok: true,
                    user: newUser,
                    token
                })
            })

        }                
        else {
            
            const token = signToken(userDB._id)

            return res.json({
                ok: true,
                user: userDB,
                token
            })
        }
        
        
    })

})


app.post('/googlemobile', (req, res) => {

    // variable coming from client side
    let googleUser = req.body
    const email = googleUser.email
    const displayName = googleUser.name
    const googleImg = googleUser.photoUrl

    User.findOne({email}).exec()
    .then(userDB => {
        
        const userChange = {
            displayName,
            google: true,
            googleImg
        }

        const _id = userDB._id

        User.findByIdAndUpdate({ _id }, userChange).exec()
        .then(result => {

            const token = signToken(_id)

            return res.json({
                ok: true,
                token
            })
        })
        .catch(err => {
            return res.json({
                ok: false,
                err: {
                    message: 'Error al actualizar'
                }
            })
        })

    })
    .catch(err => {
        res.json({
            ok: false,
            err: {
                message: 'Error al encontrar'
            }
        })
    })

})

app.get('/me', verifyToken, (req, res) => {
    res.send(req.user)
})

module.exports = app
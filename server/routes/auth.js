const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const _ = require('underscore')
const {OAuth2Client} = require('google-auth-library')
const User = require('../models/User')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const app = express()

const client = new OAuth2Client(process.env.CLIENT_ID_GOOGLE)

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
        
        // const token = jwt.sign({ 
        //     user: {
        //         _id: userDB._id
        //     } }
        //     , process.env.SEED
        //     , { expiresIn: process.env.TOKEN_EXPIRATION})

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
        audience: process.env.CLIENT_ID_GOOGLE,  // Specify the CLIENT_ID of the app that accesses the backend
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
                                err: e
                            })
                        })
    
    User.findOne({ email: googleUser.email }, (err, userDB) => {
        
        if (err) 
            return res.status(500).json({
                ok: false,
                err
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
                        err
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

app.get('/me', verifyToken, (req, res) => {
    res.send(req.user)
})

module.exports = app
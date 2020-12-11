const express = require('express')
const bcrypt = require('bcrypt')
const _ = require('underscore')
const User = require('../models/User')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const app = express()


app.get('/users', verifyToken, (req, res) => {

    // se considera como un rango inicial abierto, donde 'from = 5' ( [1,2,3,4,5[ -> 6,7,8...).
    // para controlar la cantidad por paginación
    let from = req.query.from || 0
    from = Number(from)
    
    let limit = req.query.limit || 5
    limit = Number(limit)

        
    User.find({ state: true }, 'displayName email role google state')
    .skip(from)
    .limit(limit)
    .exec((err,users) => {

        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })
        
        User.collection.countDocuments({ state: true }, (err, counting) => {
            res.json({
                ok: true,
                counting,
                users,
            })
        })        
    })
})

app.get('/users/:id', verifyToken, (req, res) => {

    let _id = req.params.id
        
    User.find({ _id }, 'displayName email role google state')
    .exec((err, users) => {

        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })
        
        res.json({
            ok: true,
            users,
        })       
    })
})

app.post('/register', [verifyToken, verifyAdminRole], function (req, res) {
    let body = req.body

    let user = new User({
        displayName: body.displayName,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role,
        state: body.state,
        google: body.google,
    })

    user.save((err, userDB) => {
        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })

        
        res.json({
            ok: true,
            user: userDB,
        })
    })

})

app.put('/users/:id', [verifyToken, verifyAdminRole], function (req, res) {
    let id = req.params.id
    // opciones de los atributos que se pueden modificar
    let body = _.pick(req.body, ['displayName','email','role','state'])
    // let body = req.body

    // new: true -> retorna el objeto modificado ,
    // runValidators: true -> valida las condiciones del Schema
    User.findByIdAndUpdate( id, body,        
        { new: true
        , runValidators: true 
        , context: 'query'
        }, (err, userDB) => {

        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })

        res.json({
            ok: true,
            user: userDB,
        })
    })

})

app.delete('/users/:id', [verifyToken, verifyAdminRole], function (req, res) {
    let id = req.params.id
    
    let changeState = {
        state: false
    }

    //     User.findByIdAndRemove(id, (err, user) => {
    User.findByIdAndUpdate( id, changeState, { new: true }, 
        (err, userDB) => {
            if (err) 
            return res.status(500).json({
                ok: false,
                err
            })

            if (!userDB) 
            return res.status(400).json({
                ok: false,
                err: 'Usuario no encontrado'
            })

            res.json({
                ok: true,
                user: userDB
            })
        })

})

module.exports = app
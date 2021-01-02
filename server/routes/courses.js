const express = require('express')
const _ = require('underscore')
const Course = require('../models/Course')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const app = express()

// filtered by key word
// app.get('/courses', verifyToken, (req, res) => {

//     let from = req.query.from || 0
//     from = Number(from)
    
//     let limit = req.query.limit || 5
//     limit = Number(limit)

        
//     Course.find({
//         description: {
//             $regex: new RegExp('cha')
//         }
//     }, { 
//         _id: 0,
//         __v: 0
//     })
//     .skip(from)
//     .limit(limit)
//     .exec((err, obj) => {

//         if (err) 
//             return res.status(400).json({
//                 ok: false,
//                 err
//             })
        
//         Course.collection.countDocuments({ state: true }, (err, counting) => {
//             res.json({
//                 ok: true,
//                 counting,
//                 arrayCount: obj.length,
//                 obj,
//             })
//         })        
//     })
// })


app.get('/course/:id', verifyToken, (req, res) => {

    const _id = req.params.id
        
    Course.findById({ _id })
    .exec((err, objDB) => {

        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })
        
        res.json({
            ok: true,
            obj: objDB
        })       
    })
})

app.post('/courses', [verifyToken, verifyAdminRole], function (req, res) {
    let body = req.body

    let obj = new Course({
        description: body.description,
        instructor: body.instructor,
        classroom: body.classroom,
        capacity: body.capacity,
        schedule: body.schedule,
    })

    obj.save((err, objDB) => {
        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })

        
        res.json({
            ok: true,
            obj: objDB,
        })
    })

})

app.put('/courses/:id', [verifyToken, verifyAdminRole], function (req, res) {
    let id = req.params.id
    // opciones de los atributos que se pueden modificar
    let body = _.pick(req.body, ['description','instructor','classroom','capacity', 'schedule'])
    // let body = req.body

    // new: true -> retorna el objeto modificado ,
    // runValidators: true -> valida las condiciones del Schema
    Course.findByIdAndUpdate( id, body,        
        { new: true
        , runValidators: true 
        , context: 'query'
        }, (err, objDB) => {

        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })

        res.json({
            ok: true,
            obj: objDB,
        })
    })

})

app.delete('/courses/:id', [verifyToken, verifyAdminRole], function (req, res) {
    let id = req.params.id
    
    let changeState = {
        state: false
    }

    //     User.findByIdAndRemove(id, (err, user) => {
    Course.findByIdAndUpdate( id, changeState, { new: true }, 
        (err, objDB) => {
            if (err) 
            return res.status(500).json({
                ok: false,
                err
            })

            if (!objDB) 
            return res.status(400).json({
                ok: false,
                err: 'Curso no encontrado'
            })

            res.json({
                ok: true,
                obj: objDB
            })
        })

})


module.exports = app
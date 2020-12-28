const express = require('express')
const _ = require('underscore')
const mongoose = require('mongoose');
const Plan = require('../models/Plan')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const app = express()


app.get('/plans/:id', verifyToken, (req, res) => {

    const id = req.params.id

    let from = req.query.from || 0
    from = Number(from)
    
    let limit = req.query.limit || 100
    limit = Number(limit)

            
    Plan.find({ state: true, user_id: id })
    .sort({initiate: 'desc'})
    .populate('course_id','description')
    .skip(from)
    .limit(limit)
    .exec((err, obj) => {

        if (err) 
            return res.status(400).json({
                ok: false,
                err
            })

        let userId = new mongoose.Types.ObjectId(id)
           
        Plan.collection.countDocuments({ state: true, user_id: userId}, (err, total) => {
            res.json({
                ok: true,
                total,
                arrayLength: obj.length,
                obj,
            })
        })        
    })
})

app.get('/myplans/:id', verifyToken, (req, res) => {

    const id = req.params.id
    let userId = new mongoose.Types.ObjectId(id)
    
    Plan.aggregate([
        {$match: { state: true, user_id: userId }},
        {$sort:{'initiate':-1}}, 
        
        { $lookup: {from: 'courses', localField: 'course_id', foreignField: '_id', as: 'course'} },
        
        {$group:{ _id: '$course_id',group:{$first:'$$ROOT'}}},
        {$replaceRoot:{newRoot:"$group"}},
        {
            "$project": {
              "_id": 1,
              "status": 1,
              "state": 1,
              "user_id": 1,
              "expiration": 1,
              "initiate": 1,
              "total_tokens": 1,
              "count_tokens": 1,
              "price": 1,
              "course._id": 1,
              "course.description": 1
            }
          }
       ])
       .exec( function (err, obj) {
        if (err) {
            res.json({
                ok: false,
                err
            });
        }
        
        res.json({
            ok: true,
            obj
        });
      }
    );
       
})

app.get('/plan/:id', verifyToken, (req, res) => {

    const _id = req.params.id
        
    Plan.findById({ _id })
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

app.post('/plans', [verifyToken, verifyAdminRole], function (req, res) {
    let body = req.body

    let obj = new Plan({
        user_id: body.user_id,
        course_id: body.course_id,
        expiration: body.expiration,
        initiate: body.initiate,
        total_tokens: body.total_tokens,
        count_tokens: body.count_tokens,
        price: body.price
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

app.put('/plans/:id', [verifyToken, verifyAdminRole], function (req, res) {
    let id = req.params.id
    // opciones de los atributos que se pueden modificar
    let body = _.pick(req.body, ['user_id','course_id','expiration','initiate', 'total_tokens'
            , 'count_tokens', 'price', 'status'])
    
    Plan.findByIdAndUpdate( id, body,        
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

app.delete('/plans/:id', [verifyToken, verifyAdminRole], function (req, res) {
    let id = req.params.id
    
    let changeState = {
        state: false
    }

    //     User.findByIdAndRemove(id, (err, user) => {
    Plan.findByIdAndUpdate( id, changeState, { new: true }, 
        (err, objDB) => {
            if (err) 
            return res.status(500).json({
                ok: false,
                err
            })

            if (!objDB) 
            return res.status(400).json({
                ok: false,
                err: 'Plan no encontrado'
            })

            res.json({
                ok: true,
                obj: objDB
            })
        })

})


module.exports = app
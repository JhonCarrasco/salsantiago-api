const express = require('express')
const bcrypt = require('bcrypt')
const _ = require('underscore')
const User = require('../models/User')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const app = express()


app.get('/attendances', (req, res) => {

    res.json({
        ok: true
    })
})

module.exports = app
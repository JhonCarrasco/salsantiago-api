const express = require('express')
const app = express()


app.use(require('./users'))
app.use(require('./avatar'))
app.use(require('./auth'))
app.use(require('./courses'))
app.use(require('./plans'))
app.use(require('./attendance'))

module.exports = app
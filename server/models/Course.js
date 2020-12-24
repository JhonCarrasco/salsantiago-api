const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator') 
const Schema = mongoose.Schema;


const courseSchema = new Schema({
    description: {
        type: String, 
        unique: true,
        required: [true, 'requerido']
    },
    instructor: {
        type: String, 
        required: false
    },
    classroom: {
        type: String,
        require: false
    },
    capacity: {
        type: Number,
        require: true
    },
    schedule: {
        type: Array,
        default: []
    },    
    state: {
        type: Boolean, 
        default: true,
    },
    
});

courseSchema.plugin( uniqueValidator, { message: '{PATH} debe ser único'} )
courseSchema.index({ '$**': 'text' })
module.exports = mongoose.model('Course', courseSchema)
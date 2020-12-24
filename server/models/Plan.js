const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const planSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course' },
    expiration: {
        type: Date,
        required: [true, 'requerido']
    },
    initiate: {
        type: Date,
        required: [true, 'requerido']
    },
    total_tokens: {
        type: Number,
        required: [true, 'requerido']
    },
    count_tokens: {
        type: Number,
        required: [true, 'requerido']
    },  
    price: {
        type: Number,
        required: [true, 'requerido']
    },  
    status: {
        type: Boolean, 
        default: true,
    },  
    state: {
        type: Boolean, 
        default: true,
    },
});

planSchema.index({ '$**': 'text' })
module.exports = mongoose.model('Plan', planSchema)
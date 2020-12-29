const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const attendanceSchema = new Schema({
    
    course_id: { type: Schema.Types.ObjectId, ref: 'Course' },
    date_session: {
        type: Date,
        required: [true, 'requerido']
    },
    concurrence: {
        type: Array,
        default: []
    },    
    state: {
        type: Boolean, 
        default: true,
    },
});

attendanceSchema.index({ '$**': 'text' })
module.exports = mongoose.model('Attendance', attendanceSchema)
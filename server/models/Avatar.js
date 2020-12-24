const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const avatarSchema = new Schema({
    cloudinary_id: {type: String, required: false},
    photoURL: {type: String, required: false},
    user_id: { type: Schema.Types.ObjectId, ref: 'User' }
});


module.exports = mongoose.model('Avatar', avatarSchema)
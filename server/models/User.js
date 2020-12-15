const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator') 

let rolesValidate = {
    values: ['ADMIN_ROLE', 'USER_ROLE'],
    message: '{VALUE} no es un rol valido'
}

let Schema = mongoose.Schema

let userSchema = new Schema({
    displayName: {
        type: String,
        required: [true, 'El nombre es requerido'],
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'El correo es requerido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
    },
    role: {
        type: String,
        default: 'USER_ROLE',
        enum: rolesValidate,
    },
    state: {
        type: Boolean,
        default: true,
    },
    google: {
        type: Boolean,
        default: false,
    },    
    googleImg: {
        type: String,
        required: false,
    },    
    phone: {
        type: String,
        required: false,
    }
})
// evitar retornar la password al cliente, ya cifrada, pero si se almacena en la DB
userSchema.methods.toJSON = function() {
    let _user = this
    let userObject = _user.toObject()
    delete userObject.password
    return userObject
}

userSchema.plugin( uniqueValidator, { message: '{PATH} debe ser único'} )

module.exports = mongoose.model('User', userSchema)
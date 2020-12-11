const express = require('express')
const Avatar = require('../models/Avatar')
const { verifyToken } = require('../middlewares/authentication')
const cloudinary = require("../utils/cloudinary")
const upload = require("../utils/multer")
const app = express()

// default options
// app.use(fileUpload({ useTempFiles: true }));

app.put('/avatar', upload.single("myfile"), verifyToken, async (req, res) => {

    let userToken = req.user
    let avatarCloud = null

    try {

        const avatarDB = await Avatar.findOne({ user_id: userToken._id}, (err, avatarDB) => {

            if (err) 
                return null
    
            return avatarDB
        })


        if (!avatarDB) {
            avatarCloud = await uploaderImage(req.file.path)

            let avatarObj = new Avatar({
                cloudinary_id: avatarCloud.public_id,
                photoURL: avatarCloud.secure_url,
                user_id: userToken._id
            })

            // Create new Avatar
            avatarObj.save((err, avatarDB) => {
                if (err) 
                    return res.status(400).json({
                        ok: false,
                        err
                    })
        
                
                res.json({
                    ok: true,
                    avatar: avatarDB,
                })
            })
        }
        else {
            // Delete current
            const respDelete = await cloudinary.uploader.destroy(avatarDB.cloudinary_id, (err,result) => {
                if (err) {
                    return err
                }
                return result                
            })
            
            if (respDelete.result === 'ok') {
                // Upload image to cloudinary
                avatarCloud = await uploaderImage(req.file.path)

                let avatarChange = {
                    cloudinary_id: avatarCloud.public_id,
                    photoURL: avatarCloud.secure_url
                }

                Avatar.findByIdAndUpdate({ _id: avatarDB._id}, avatarChange, 
                    { new: true
                    , runValidators: true 
                    , context: 'query'
                    }, (err, avatarUpdate) => {
            
                    if (err) 
                        return res.status(400).json({
                            ok: false,
                            err
                        })
            
                    res.json({
                        ok: true,
                        avatar: avatarUpdate,
                    })
                })
            }
            else {
                return res.status(500).json({
                    ok: false,
                    err: {
                        message: 'No se ha borrado de cloudinary'
                    }
                })
            }
            
           
        }
   

      } catch (err) {
        res.json({
            ok: false,
            err:{
                message: 'ERROR'
            }
        })
      }
    

})

const uploaderImage = async (file) => {
    // Upload image to cloudinary        
    const result = await cloudinary.uploader.upload(file, {
        width: 563, height: 563, crop: "limit",
        folder: 'Avatars_Salsantiago',
        use_filename: true
       })

    return result
}

module.exports = app
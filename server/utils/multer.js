const multer = require("multer");
const path = require("path"); 
// Multer config
module.exports = multer({
    // limits:{
    //     fileSize:2000000, //2MB
    // },
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        if(!file.originalname.match(/\.(jpg|png|JPG|PNG|JPEG|jpeg)$/))
        return cb(new Error('File type is not supported'))
        cb(undefined,true)
    },
})
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const MIME_TYPE_MAP = {
    "image/png":"png",
    "image/jpeg":"jpeg",
    "image/jpg":"jpg"
}
if(process.env.NODE_ENV === "development"){
    const fileUpload = multer({
        limits:700000,
        storage:multer.diskStorage({
            destination: (req,file,cb) =>{
                cb(null,"uploads/images");
            },
            filename:(req,file,cb)=>{
                const ext = MIME_TYPE_MAP[file.mimetype];
                cb(null,uuidv4()+"."+ext);
            }
        }),
        fileFilter:(req,file,cb)=>{
            const isValid = !!MIME_TYPE_MAP[file.mimetype];
            const error = isValid ? null : new Error("Invalid mime type!");
            cb(error,isValid);
        }
    })
}else{
    const fileUpload = multer({
        limits:700000,
        storage:multer.diskStorage({
            destination: (req,file,cb) =>{
                cb(null,path.resolve("uploads/images","build"));
            },
            filename:(req,file,cb)=>{
                const ext = MIME_TYPE_MAP[file.mimetype];
                cb(null,uuidv4()+"."+ext);
            }
        }),
        fileFilter:(req,file,cb)=>{
            const isValid = !!MIME_TYPE_MAP[file.mimetype];
            const error = isValid ? null : new Error("Invalid mime type!");
            cb(error,isValid);
        }
    })
}

module.exports = fileUpload;
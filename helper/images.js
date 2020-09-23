// const User=require("../modals/user")
const multer=require("multer")
const fs=require('fs')
exports.uploadImage=(req,res,next)=>{
    var dest=req.dest;
    const name=fs.readdirSync(dest).length;
    const storage=multer.diskStorage({
        destination:dest,
        filename:(req,file,cb)=>{
            if(file.mimetype=="image/jpg" || file.mimetype=="image/png" || file.mimetype=="image/jpeg"){
                req.name=`${dest.split('public/')[1]}${name}.${file.mimetype.split('/')[1]}`;
                req.imageno=name;
                cb(null,`${name}.${file.mimetype.split('/')[1]}`)
            }
            else
                cb('file type not supported')
        }
    })
    const upload=multer({storage:storage});
    // console.log(req.imgName)
    upload.single(req.imgName)(req,res,()=>{
        next();
    })
    // console.log(req.file)
    // console.log("asdg")
}
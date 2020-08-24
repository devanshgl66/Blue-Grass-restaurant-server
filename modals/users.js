// const mongoose=require('mongoose');
// const schema=mongoose.Schema;
// var userSchema=new schema({
//     username:{
//         type:String,
//         unique:true,
//         required:true
//     },
//     password:{
//         type:String,
//         required:true
//     },
//     admin:{
//         type:Boolean,
//         default:false
//     }
// });
// module.exports=mongoose.model('user',userSchema);

//user Modal to store user auth details using passport
const mongoose=require('mongoose');
const passportLocalMongoose=require('passport-local-mongoose');
var user=new mongoose.Schema({
    firstname:{
        type:String,
        default:''
    },
    lastname:{
        type:String,
        default:''
    },
    admin:{
        type:Boolean,
        default:false
    },
    email:{     
        /* unique here doesn't work so inside terminal open mongoose and use 
        command db.collectionName.createIndex( { "email": 1 }, { unique: true } )
        and check it using db.collectionName.getIndexes() */
        type:String,
        unique:true
    },
    verified:{    //verified or not
        type:Boolean,
        default:false
    },
    verifyOtp:{
        type:Number,
        default:-1
    },
    forgetPasswordOtp:{
        type:Number,
        default:-1
    }
    //ifyou wish to save password here also.
    // ,pwd:{
    //     type:String
    // }
},{
    strict:true
});
//To save username and password in hashed way and to use inbuilt authenticate and lot other methods
user.plugin(passportLocalMongoose);
//User is model
const User=mongoose.model('user',user);

module.exports=User
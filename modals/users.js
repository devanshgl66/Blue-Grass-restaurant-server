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
    }
    //ifyou wish to save password here also.
    // ,pwd:{
    //     type:String
    // }
});
//To save username and password in hashed way and to use inbuilt authenticate and lot other methods
user.plugin(passportLocalMongoose);
module.exports=mongoose.model('user',user);
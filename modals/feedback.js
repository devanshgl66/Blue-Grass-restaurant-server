const mongoose=require('mongoose')
const feedback=new mongoose.Schema({
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        default:''
    },
    telnum:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    agree:{
        type:Boolean,
        default:false
    },
    contactType:{
        type:String,
        default:'Tel.'
    },
    feedback:{
        type:String,
        required:true
    }
},{
    timestamps:true
});
const feedbacks= mongoose.model('feedback',feedback)
module.exports=feedbacks
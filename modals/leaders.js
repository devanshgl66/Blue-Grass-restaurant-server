const mongoose=require('mongoose');
const scheme=mongoose.Schema;
const leaderSchema=new scheme({
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    designation:{
        type:String,
        required:true
    },
    abbr:{
        type:String,
        required:true
    },
    featured:{
        type:Boolean,
        default:false
    },
    description:{
        type:String,
        required:true
    }
})
const leader=mongoose.model('leader',leaderSchema);
module.exports=leader;
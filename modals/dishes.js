//Modal of dishes
const mongoose=require('mongoose');
const { ObjectId } = require('mongoose');
const schema=mongoose.Schema;
require('mongoose-currency').loadType(mongoose);
const Currency=mongoose.Types.Currency;
const commentSchema=new schema({
    rating:{
        type:Number,
        min:1,
        max:5,
        required:true
    },
    comment:{
        type:String,
        required:true
    },
    author:{
        // type:String,
        // required:true

        //to use population
        type:ObjectId,
        ref:'user'
    },
    date:{
        type:Date,
        default:Date.now
    }
},{
    //will not have created at and updated at attribute
    timestamps:false
})
const dishSchema=new schema({
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    label:{
        type:String,
        default:''
    },
    price:{
        type:Currency,
        required:true
    },
    featured:{
        type:Boolean,
        default:false
    },
    description:{
        type:String,
        required:true
    },
    comments:{
        type:[commentSchema],
        required:false
    },
    id:{
        type:String,
        default:''
    }
})
const dishes=mongoose.model('dish',dishSchema);
module.exports=dishes;
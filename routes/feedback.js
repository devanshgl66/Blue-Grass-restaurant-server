const express=require('express')
const Feedback = require('../modals/feedback')
const bodyParser = require('body-parser')
const cors  = require('../cors')
const feedbackRouter=express.Router()
feedbackRouter.use(bodyParser.json())  //to get req data as req.body

feedbackRouter.route('/')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    Feedback.find()
    .then((feedback)=>{
        console.log(feedback);
        if(feedback){
            res.statusCode=200
            res.setHeader('content-type','application/json')
            res.send(feedback)
        }
        else{
            res.statusCode=500
            res.setHeader('content-type','application/json')
            res.send({success:false,err:'Error occured.\nTry again later.'})
        }
    },error=>{
        res.statusCode=500
        res.setHeader('content-type','application/json')
        res.send({success:false,status:error.message})
    })
    .catch(err=>next(err))
})
.post(cors.corsWithOptions,(req,res,next)=>{
    Feedback.create(req.body)
    .then((feedback)=>{
        console.log(feedback)
        if(feedback){
            res.statusCode=200
            res.setHeader('content-type','application/json')
            res.send(feedback)
        }
        else{
            res.statusCode=500
            res.setHeader('content-type','application/json')
            res.send({success:false,status:'Feedback could not be posted.Server error'})
        }
    },error=>{
        throw new Error(error)
    })
    .catch(err=>next(err))
})
module.exports= feedbackRouter
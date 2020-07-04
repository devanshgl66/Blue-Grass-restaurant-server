const express=require('express')
const bodyParser=require('body-parser');
const Leader=require('../modals/leaders');
const cors=require('../cors')
const authenticate=require('../authenticate')

const leaderRouter=express.Router()
leaderRouter.use(bodyParser.json());

leaderRouter.route('/')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    //returns all promotions
    Leader.find({})
    .then((leaders)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(leaders);
    })
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //deleting all promotions
    Leader.deleteMany({})
    .then((result)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(result);
    })
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //insert a promotion
    //data parsed so it is in req.body
    Leader.create(req.body)
    .then((docs)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(docs);
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    res.statusCode = 403;
    res.end('PUT operation not supported on /leaders');
})

leaderRouter.route('/:leaderId')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.corsWithOptions,(req,res,next)=>{
    //return leader with leader id as leaderId
    Leader.findById(req.params.leaderId)
    .then((leader)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.json(leader);
    })
    .catch((err)=>next(err));
})
.post(authenticate.verifyUser,(req,res,next)=>{
    res.statusCode = 403;
    res.end('POST operation not supported on /leaders/'+req.params.leaderId);
})
.delete(authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //delete leader with leader id as leaderId
    Leader.findByIdAndDelete(req.params.leaderId)
    .then((resp)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.json(resp);
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //update this leader with data provided as body of req
    Leader.findByIdAndUpdate(req.params.leaderId,{
        $set:req.body
    },{
        new:true
    })
    .then((newDish)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.json(newDish);
    })    
    .catch((err)=>next(err));
})

module.exports=leaderRouter;
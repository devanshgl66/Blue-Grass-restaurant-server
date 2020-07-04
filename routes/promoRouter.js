const express=require('express')
const bodyParser=require('body-parser');
const Promo=require('../modals/promotions');

const authenticate=require('../authenticate')
const cors=require('../cors')
const promoRouter=express.Router()
promoRouter.use(bodyParser.json());

promoRouter.route('/')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    //returns all promotions
    Promo.find({})
    .then((promos)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(promos);
    })
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //deleting all promotions
    Promo.deleteMany({})
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
    Promo.create(req.body)
    .then((docs)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(docs);
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    res.statusCode = 403;
    res.end('PUT operation not supported on /promotions');
})

promoRouter.route('/:promoId')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    
    //return promo with promo id as promoId
    Promo.findById(req.params.promoId)
    .then((promo)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.json(promo);
    })
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    res.statusCode = 403;
    res.end('POST operation not supported on /promotions/'+req.params.promoId);
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //delete promo with promo id as promoId
    Promo.findByIdAndDelete(req.params.promoId)
    .then((resp)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.json(resp);
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //update this promo with data provided as body of req
    Promo.findByIdAndUpdate(req.params.promoId,{
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

module.exports=promoRouter;
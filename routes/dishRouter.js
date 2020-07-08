//routes all request for dishes
const express=require('express');
const bodyParser=require('body-parser');
const Dishes=require('../modals/dishes');
const authenticate=require('../authenticate')
const cors=require('../cors')
const dishRouter=express.Router();
dishRouter.use(bodyParser.json())
dishRouter.route('/')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    
    //returns all dishes
    Dishes.find({})
    .populate('comments.author')
    .then((dishes)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(dishes);
    })
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    // console.log('hello')
    Dishes.deleteMany({})
    .then((result)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(result);
    })
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //insert a document
    //data parsed so it is in req.body
    Dishes.create(req.body)
    .then((docs)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send(docs);     
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})

dishRouter.route('/:dishId')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    //return dish with dish id as dishId
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.json(dish);
    })
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/'+req.params.dishId);
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //delete dish with dish id as dishId
    Dishes.findByIdAndDelete(req.params.dishId)
    .then((resp)=>{
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.json(resp);
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    //update this dish with data provided as body of req
    Dishes.findByIdAndUpdate(req.params.dishId,{
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

dishRouter.route('/:dishId/comments')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    //send all comment of given dish
    // console.log('Hello')
    Dishes.findOne({id:req.params.dishId})
    .populate('comments.author')
    .then((dish)=>{
        if(dish!= null){
            //send comments
            res.statusCode=200;
            res.setHeader('content-type','application/json');
            res.json(dish.comments);
        }
        else{
            res.statusCode=404
            res.setHeader('content-type','application/json')
            res.send({success:false,status:'No dish found with id: '+req.params.dishId})                
        }
    })
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    console.log(req.body)
    //adding comment of given dish
    // Dishes.findById(req.params.dishId)
    Dishes.findOne({id:req.params.dishId})
    .populate('comments.author')
    .then((dish)=>{
        // console.log('bye')
        if(dish!= null){
            //add comments
            req.body.author=req.user._id;
            dish.comments.unshift(req.body);
            dish.save()
            .then((dish)=>{
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish)=>{
                    res.statusCode=200;
                    res.setHeader('content-type','application/json');
                    res.json(dish);
                })
            })
            .catch((err)=>next(err));
        }
        else{
            res.statusCode=404
            res.setHeader('content-type','application/json')
            res.send({success:false,status:'No dish found with id: '+req.params.dishId})                
        
        }
    })
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
    
    
    //delete all comments of given dish
    Dishes.findByIdAndUpdate(req.params.dishId,{
        $set:{
            comments:[]
        }
    },{
        new:true
    })
    .then((dish)=>{
        if(dish!= null){
            res.statusCode=200;
            res.setHeader('content-type','application/json');
            res.json(dish);
        }
        else{
            res.statusCode=404
            res.setHeader('content-type','application/json')
            res.send({success:false,status:'No dish found with id: '+req.params.dishId})                
        
        }
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes/'+ req.params.dishId + '/comments');
})

dishRouter.route('/:dishId/comments/:commentId')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    //send this particular comment of this dish
    Dishes.find(req.params.dishId)
    .populate('comments.author')
    .then((dish)=>{
        if(dish!=null){
            if(dish.comments.id(req.params.commentId)!=null){
                res.statusCode=200;
                res.setHeader('content-type','application/json');
                res.json(dish.comments.id(req.params.commentId));
            }
            else{
                res.statusCode=404
                res.setHeader('content-type','application/json')
                res.send({success:false,status:'Comment '+req.params.commentId+' not found'})                
        
            }
        }
        else{
            res.statusCode=404
            res.setHeader('content-type','application/json')
            res.send({success:false,status:'Dish '+req.params.dishId+' not found'})                
        }
    })
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    //deleting selected comment
    Dishes.findOne({id:req.params.dishId})
    .populate('comments.author')
    .then((dish)=>{
        if(dish!=null){
            if(dish.comments.id(req.params.commentId)!=null){
                //can be performed by same person only
                if(req.user._id.toString() !=dish.comments.id(req.params.commentId).author._id.toString()){
                    
                    res.statusCode=401
                    res.setHeader('content-type','application/json')
                    res.send({success:false,status:'unauthorized'})                                    
                    return
                }
                dish.comments.id(req.params.commentId).remove();
                dish.save()
                .then((dish)=>{
                    res.statusCode=200;
                    res.setHeader('content-type','application/json');
                    res.send(dish);
                })
            }
            else{
                res.statusCode=404
                res.setHeader('content-type','application/json')
                res.send({success:false,status:'Comment '+req.params.commentId+' not found'})                                    
                
            }
        }
        else{            
            res.statusCode=404
            res.setHeader('content-type','application/json')
            res.send({success:false,status:'Dish '+req.params.dishId+' not found'})                                    
            
        }
    })
    .catch((err)=>next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{


    Dishes.findOne({id:req.params.dishId})
    .populate('comments.author')
    .then((dish)=>{
        if(dish!=null){
            if(dish.comments.id(req.params.commentId)!=null){

                //can be performed by same person only
                if(req.user._id.toString() !=dish.comments.id(req.params.commentId).author._id.toString()){
                    var err=new Error('unauthorized')
                    next(err)
                    return
                }
                // console.log(dish.comments.id(req.params.commentId))
                // dish.comments.id(req.params.commentId).remove();
                // req.body.author=req.user._id
                // dish.comments.push(req.body);
                dish.comments.id(req.params.commentId).comment=req.body.comment
                dish.save()
                .then((dish)=>{
                    res.statusCode=200;
                    res.setHeader('content-type','application/json');
                    res.send(dish);
                })
            }
            else{
                res.statusCode=404
                res.setHeader('content-type','application/json')
                res.send({success:false,status:'Comment '+req.params.commentId+' not found'})                                    
            
            }
        }
        else{
            res.statusCode=404
            res.setHeader('content-type','application/json')
            res.send({success:false,status:'Dish '+req.params.dishId+' not found'})
        }
    })
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    res.statusCode=403;
    res.end('POST operation not supported on /dishes/'+ req.params.dishId+ '/comments/' + req.params.commentId);
})
module.exports=dishRouter;
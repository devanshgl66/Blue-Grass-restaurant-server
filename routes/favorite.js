const express=require('express');
const bodyParser=require('body-parser');
const Dishes=require('../modals/dishes');
const User=require('../modals/users')
const authenticate=require('../authenticate')
const cors=require('../cors')
const favoriteRouter=express.Router();
favoriteRouter.use(bodyParser.json())
favoriteRouter.route('/')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,(req,res,next)=>{
    if(req.headers.authorization && req.headers.authorization.split('Bearer ')[1]!='undefined'){
        console.log(req.user);
        authenticate.verifyUser(req,res,()=>{
            User.findById(req.user.id)
            .populate('favorite')
            .populate('comments.author')
            .then((user)=>{
                console.log(user)
                res.send(user.favorite)
            })
            
        })
    }
    else{
        Dishes.find({})
        .populate('comments.author')
        .then((docs)=>{
            res.send(docs)
        })
    }
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    User.findById(req.user._id)
    .populate('favorite')
    .populate('comments.author')
    .then((user)=>{
        console.log(user);
        var b=false;
        for(dish of user.favorite){
            console.log(dish)
            if(req.body.dishId == dish._id){
                b=true;
                break;
            }}
        if(b==true){
            console.log(user.favorite)
            res.send(user.favorite)
        }
        else{
            Dishes.findById(req.body.dishId)
            .then((dish)=>{
                if(!dish){
                    res.status(400).send({err:'dish not found.'})
                }
                else{
                    user.favorite.push(req.body.dishId);
                    user.save()
                    .then((user)=>{
                        User.findById(req.user._id)
                        .populate('favorite')
                        .populate('comments.author')
                        .then((user)=>{
                            res.send(user.favorite)
                        })
                    },(err)=>
                        next(err))
                }
            })
        }        
    })
})
favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.delete(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    User.findById(req.user._id)
    .then(async(user)=>{
        var index=user.favorite.indexOf(req.params.dishId);
        if(index!=-1){
            user.favorite.splice(index,1);
            await Dishes.find({})
            .then(dishes=>{
                for(var i=0;i<user.favorite.length;){
                    if(user.favorite[i]==null ||user.favorite[i]==undefined||
                         dishes.some((dish)=>{
                        return dish._id.toString()==user.favorite[i].toString()
                    })===false)
                        user.favorite.splice(i,1);
                    else   
                        i++;
                }
            })
            user.save()
            .then((user)=>{
                User.findById(req.user.id)
                .populate('favorite')
                .populate('comments.author')
                .then((user)=>
                    res.status(200).send(user.favorite)
                )
            })
        }
        else{
            var err=new Error('dish is not favorite.')
            err.status=400;
            next(err);
        }
        // res.send(user.favorite)
    })
    .catch((err)=>next(err))
})
module.exports=favoriteRouter;
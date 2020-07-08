// var express = require('express');
// const bodyPaser=require('body-parser');
// var users=require('../modals/users');

// var router = express.Router();
// router.use(bodyPaser.json());
// /* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });
// router.route('/signup')
// .post((req,res,next)=>{
//   //if username already not present then add it to users modal
//   users.findOne({username:req.body.username})
//   .then((user)=>{
//     if(user !=null){
//       var err = new Error('User ' + req.body.username + ' already exists!');
//       err.status = 403;
//       next(err);
//     }
//     else{
//       return users.create({
//         username:req.body.username,
//         password:req.body.password
//       });
//     }
//   })
//   .then((user)=>{
//     if(user){
//       res.statusCode=200;
//       res.setHeader('content-Type','text/plain');
//       res.end('User ' +req.body.user +' registered succesfully');
//     }
//     else{
//       var err=new Error('Some error occured while registering.Please try again');
//       err.status=403;
//       next(err);
//     }
//   })
//   .catch((err)=>next(err));
// });
// router.route('/login')
// .post((req,res,next)=>{
//   //checking if user already logged in or not
//   console.log(req.session);
//   if(!req.session.user) {
//     //user is not logged in.
//     var authHeader = req.headers.authorization;
    
//     if (!authHeader) {
//       var err = new Error('You are not authenticated!');
//       res.setHeader('WWW-Authenticate', 'Basic');
//       err.status = 401;
//       return next(err);
//     }
  
//     var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
//     var username = auth[0];
//     var password = auth[1];
  
//     users.findOne({username: username})
//     .then((user) => {
//       if (user === null) {
//         var err = new Error('User ' + username + ' does not exist!');
//         err.status = 403;
//         return next(err);
//       }
//       else if (user.password !== password) {
//         var err = new Error('Your password is incorrect!');
//         err.status = 403;
//         return next(err);
//       }
//       else if (user.username === username && user.password === password) {
//         req.session.user = 'authenticated';
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'text/plain');
//         res.end('You are authenticated!')
//       }
//     })
//     .catch((err) => next(err));
//   }
//   else {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end('You are already authenticated!');
//   }
// })
// router.route('/logout')
// .get((req,res,next)=>{
//   console.log(req.session);
//   if(!req.session.user){
//     var err=new Error('You are not logged in');
//     err.status=403;
//     next(err);
//   }
//   else{
//     req.session.destroy();
//     res.clearCookie('session-id');
//     //sent to home page.
//     res.redirect('/');
//   }
// })
// module.exports = router;


//Passport user
const express=require('express');
const bodyParser=require('body-parser');
const user=require('../modals/users');
const passport=require('passport');
var router=express.Router();
const authenticate=require ('../authenticate')
const cookieparser=require('cookie-parser')
const cors=require('../cors')
router.use(bodyParser.json());
router.route('/signup')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  user.register(new user( {
    username:req.body.username,
    firstname:req.body.firstname || '',
    lastname:req.body.lastname || ''
    //any other field else to send here 
  }),req.body.password,(err,User)=>{
    if(err){
      res.statusCode=500;
      res.setHeader('content-type','application/json');
      res.json({success:false,err:err});
    }
    else{
      res.statusCode=200;
      res.setHeader('content-type','application/json');
      res.json({success:true, status: 'Registration Successful!'})
    }
  })
})

router.route('/login')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  // console.log(req.body)
  if(req.signedCookies.token){
    console.log(authenticate.verifyUser)
    res.statusCode=400;
    res.setHeader('content-type','application/json');
    res.json({success:false,status:'You are already logged in!'});
  }
  else{
    // passport.authenticate('local') will authenticate itself and handle any error if occured
    // console.log('hlo')
    passport.authenticate('local',(err,User,info)=>{
      // console.log(err,User,info)
      if(err)
        next(err)
      else if(info){
        var err=new Error(info)
        next(err)
        // throw err;
      }
      else{
        req.user=User
        console.log(req.user)
        var token=authenticate.getToken({_id:req.user._id})
        res.cookie('token',token,{signed:true,httpOnly:true,expires:new Date(Date.now()+(24*60*60*1000))})
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send({success:true, status: 'You are logged in!'})
      }
    })(req,res,()=>{
      // console.log('hlos')
      res.send()
    })
    // console.log('as')
  }
})  

router.route('/')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,authenticate.verifyUser,(req,res,next)=>{
  if(req.user.admin==false){
    res.statusCode=400;
    res.setHeader('content-type','application/json');
    res.send({success:false, status:'Not allowed'})
  }
  user.find({})
  .then((users)=>{
    res.statusCode=200;
    res.setHeader('content-type','application/json');
    res.json(users);
  })
})
.delete(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
  if(req.user){
    if(req.user.admin){
      user.deleteMany({})
      .then((result)=>{
        res.json(result);
      })
    }
    else{
      res.statusCode=400;
      res.setHeader('content-type','application/json');
      res.send({success:true, status: 'You are not allowed this task.'})
    }
  }
  else{
    res.statusCode=400;
    res.setHeader('content-type','application/json');
    res.send({success:true, status: 'Login First.'})
  }
})


router.route('/logout')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  // if(req.session.user){  
  //   req.session.destroy();
  //   res.clearCookie();
  //   res.statusCode=200;
  //   res.setHeader('content-type','application/json');
  //   res.json({success:true,status:'you are logout successfully'});
  // }
  // else{
  //   res.statusCode=500;
  //   res.setHeader('content-type','application/json');
  //   res.json({err:err});
  // }

  if( req.signedCookies.token){
    // console.log('A')
    res.clearCookie('token')
    res.statusCode=200
    res.setHeader('content-type','application/json')
    res.send({success:true,status:'You have successfully logged out'})
  }
  else{
    // console.log('B')
    res.statusCode=400
    res.setHeader('content-type','text/plain')
    res.send({success:false,status:'Login first.'})
  }
  //TODO logout
})

router.route('/availableUName')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  var username=req.body.username;
  user.find({username:username})
  .then((User)=>{
    console.log(User)
    if(User && User.length){
      res.statusCode=200
      res.setHeader('content-type','application/json')
      res.send({available:false,username:username})
    }
    else{
      res.statusCode=200
      res.setHeader('content-type','application/json')
      res.send({available:true,username:username})
    }
  })
  .catch(err=>next(err))
})
module.exports = router;
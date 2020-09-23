//Passport user
const express=require('express');
const bodyParser=require('body-parser');
const user=require('../modals/users');
const passport=require('passport');
var router=express.Router();
const authenticate=require ('../authenticate')
const cookieparser=require('cookie-parser')
const cors=require('../cors')
const nodemailer = require('nodemailer');
router.use(bodyParser.json());

//function to send otp to user
async function sendOTP(email,otp,subject,text){
  var transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: 'restaurantbluegrass@hotmail.com',
      pass: 'Microsoft@12'
    }
  });
  
  var mailOptions = {
    from: 'restaurantbluegrass@hotmail.com',
    to: email,
    subject: subject,
    html: `${text}${otp}</h1>`
  };
  try{
    const info=await transporter.sendMail(mailOptions)
    console.log('Email sent: ' + info.response);
    return true;
  }
  catch(err){
    console.log(err)
    return false;
  }
}
//function to generate otp , storing in db and sending to user
async function genOTP(email,subject,text,typeOfOtp){
  let otp=Math.floor(Math.random()*900000+100000)
  //sending OTP to user
  const result = await sendOTP(email,otp,subject,text)
  if(result==true){
    //saving OTP on database
    try{
      const r2=await user.findOneAndUpdate({email:email},{$set:{[typeOfOtp]:otp}});
      return true;
    }catch(err){
      console.log(err)
      return false
    }
  }
  else{
    return false;
  }  
}
router.route('/signup')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  user.register(new user( {
    username:req.body.username,
    firstname:req.body.firstname || '',
    lastname:req.body.lastname || '',
    email:req.body.email
    //any other field else to send here 
  }),req.body.password,(err,User)=>{
    if(err){
      if(err.errmsg && (err.errmsg.includes('duplicate key error index: node.users.$email_1')  //for local mongodb
      || err.errmsg.includes('duplicate key error collection: node.users index: email_1 dup key: { email:')))  //for mongoose atlas
        err= {
          name: "UserExistsError",
          message: "A user with the given email is already registered"
        }
        err.status=400;
        next(err);
      // res.statusCode=400;
      // res.setHeader('content-type','application/json');
      // res.json({success:false,err:err});
    }
    else{
      genOTP(req.body.email,'OTP for verifying at restaurant blue grass',`Your OTP to verify your email at restaurant blue grass is<br><h1>`,'verifyOtp');
      res.statusCode=200;
      res.setHeader('content-type','application/json');
      res.json({status: 'Registration Successful!\nPlease verify your email by entering otp sent to your email.'})
    }
  })
})
router.route('/login')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  // console.log(req.body)
  // console.log(req.headers.authorization)
  if(req.headers.authorization && req.headers.authorization.split('Bearer ')[1]!='undefined'){
    // console.log(authenticate.verifyUser)
    var err=new Error('You are already logged in!');
    err.status=400;
    next(err);
  }
  else{
    // passport.authenticate('local') will authenticate itself and handle any error if occured
    // console.log('hlo')
    user.findOne({username:req.body.username})
    .then((User)=>{
      
      // console.log(User);
      if(User && User.verified==false){
        var err=new Error('Please verify your email first.');
        err.status=400;
        next(err);
      }
    })
    passport.authenticate('local',(err,User,info)=>{
      // console.log(err,User,info)
      if(err){
        res.status(500).send(err);
      }
      else if(info){
        var err=new Error("Wrong username or password");
        err.status=401;
        next(err);
      }
      else{
        req.user=User
        
        var token=authenticate.getToken({_id:req.user._id})
        User.salt=undefined
        User.hash=undefined
        console.log(User.salt)
        console.log(User)
        // res.cookie('token',token,{signed:true,httpOnly:true,expires:new Date(Date.now()+(24*60*60*1000))})
        res.statusCode=200;
        res.setHeader('content-type','application/json');
        res.send({token:token,admin:User.admin, status: 'You are logged in!'})
      }
    })(req,res,next)
    // console.log('as')
  }
})  
router.route('/verify/resendOTP')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  user.findOne({email:req.body.email})
  .then((User)=>{
    if(!User){
      res.statusCode=400
      res.setHeader('content-type','application/json')
      res.send({success:false,status:'Email not found.Please register first'})
    }
    else if(User.verified==true){
      var err=new Error('Email already verified.');
      err.status=400;
      next(err);
    }
    else{
      genOTP(req.body.email,'OTP for verifying at restaurant blue grass',`Your OTP to verify your email at restaurant blue grass is<br><h1>`,'verifyOtp');
      res.statusCode=200
      res.setHeader('content-type','application/json')
      res.send({status:'OTP sent.'})
    }
  })
  .catch((err)=>{
    next(err);
  })
})
router.route('/forgetPassword/genOTP')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  user.findOne({email:req.body.email})
  .then((User)=>{
    if(!User){
      var err=new Error('Email not found.Please register first');
      err.status=400;
      next(err);
    }
    else{
      genOTP(req.body.email,'OTP for change password at restaurant blue grass',`Your OTP to change password at restaurant blue grass is<br><h1>`,'forgetPasswordOtp')
      .then((result)=>{
        if(result==true){
          res.statusCode=200
          res.setHeader('content-type','application/json')
          res.send({status:'OTP sent.'})
        }
        else throw new Error('error occured')
      })
      .catch((err)=>{
        next(err);
      })
    }
  })
  .catch((err)=>{
    next(err);
  })
})
router.route('/forgetPassword/changePassword')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  user.findOne({email:req.body.email})
  .then((User)=>{
    if(!User){
      var err=new Error('Email not found.Please register first');
      err.status=400;
      next(err);
    }
    else{
      if(req.body.otp!=User.forgetPasswordOtp || req.body.otp==-1){
        var err=new Error('Wrong OTP');
        err.status=400;
        next(err);
      }
      else{
        user.findOneAndUpdate({email:req.body.email},{$set:{forgetPasswordOtp:-1}},(err,User)=>{
          if(err){
            next(err);   
          }
          else{
            User.setPassword(req.body.password)
            .then((newUser)=>{
              newUser.save();
              res.status(200).json({message: 'password reset successful'});
            })  
          }
        })
      }
    }
  })  
})

router.route('/verify/verify')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  //body contains email and otp
  user.findOne({email:req.body.email})
  .then((User)=>{
    if(!User){
      var err=new Error('Email not found.Please register first');
      err.status=400;
      next(err);
    }
    else if(User.verified==true){
      var err=new Error('Email already verified.');
      err.status=400;
      next(err);
    }
    else if(req.body.otp!=User.verifyOtp || req.body.otp==-1){
      var err=new Error('Wrong OTP');
      err.status=400;
      next(err);
    }
    else{
      user.findOneAndUpdate({email:req.body.email},{$set:{verified:true,verifyOtp:-1}},(err,User)=>{
        if(err){
          next(err); 
        }
        else{
          res.statusCode=200
          res.setHeader('content-type','application/json')
          res.send({status:'Email verified'})  
        }
      })
    } 
  })
  .catch((err)=>{
    next(err);
  })
})
router.route('/')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.get(cors.cors,authenticate.verifyUser,(req,res,next)=>{
  if(req.user.admin==false){
    var err=new Error('Not allowed');
    err.status=400;
    next(err);
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
      var err=new Error('You are not allowed this task.');
      err.status=400;
      next(err);
    }
  }
  else{
    var err=new Error('Login First.');
    err.status=400;
    next(err);
  }
})


router.route('/logout')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  if( req.headers.authorization && req.headers.authorization.split('Bearer ')[1]!='undefined'){
    // console.log('A')
    // res.clearCookie('token')
    res.statusCode=200
    res.setHeader('content-type','application/json')
    res.send({status:'You have successfully logged out'})
  }
  else{
    // console.log('B')
    var err=new Error('Login first.');
    err.status=400;
    next(err);
  }
})

router.route('/availableUName')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  var username=req.body.username;
  user.find({username:username})
  .then((User)=>{
    console.log(User)
    if((User && User.length)||(username.search(/admin/i)==-1)){
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
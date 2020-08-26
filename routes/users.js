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
    service: 'gmail',
    auth: {
      user: 'a9416749221@gmail.com',
      pass: 'qwertypopo'
    }
  });
  
  var mailOptions = {
    from: 'a9416749221@gmail.com',
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
      if(err.errmsg && err.errmsg.includes('duplicate key error index: node.users.$email_1'))
        err= {
          name: "UserExistsError",
          message: "A user with the given email is already registered"
        }
      res.statusCode=500;
      res.setHeader('content-type','application/json');
      res.json({success:false,err:err});
    }
    else{
      genOTP(req.body.email,'OTP for verifying at restaurant blue grass',`Your OTP to verify your email at restaurant blue grass is<br><h1>`,'verifyOtp');
      res.statusCode=200;
      res.setHeader('content-type','application/json');
      res.json({success:true, status: 'Registration Successful!\nPlease verify your email by entering otp sent to your email.'})
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
    user.findOne({username:req.body.username})
    .then((User)=>{
      console.log(User);
      if(User.verified==false){
        res.statusCode=400;
        res.setHeader('content-type','application/json');
        res.send({success:false, status:'Please verify your email first.'})  
        next()
      }
    })
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
      res.statusCode=400
      res.setHeader('content-type','application/json')
      res.send({success:false,status:'Email already verified.'})
    }
    else{
      genOTP(req.body.email,'OTP for verifying at restaurant blue grass',`Your OTP to verify your email at restaurant blue grass is<br><h1>`,'verifyOtp');
      res.statusCode=200
      res.setHeader('content-type','application/json')
      res.send({success:true,status:'OTP sent.'})
    }
  })
  .catch((err)=>{
    res.statusCode=500
    res.setHeader('content-type','application/json')
    res.send({success:false,err:err})
  })
})
router.route('/forgetPassword/genOTP')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  user.findOne({email:req.body.email})
  .then((User)=>{
    if(!User){
      res.statusCode=400
      res.setHeader('content-type','application/json')
      res.send({success:false,status:'Email not found.Please register first'})
    }
    else{
      genOTP(req.body.email,'OTP for change password at restaurant blue grass',`Your OTP to change password at restaurant blue grass is<br><h1>`,'forgetPasswordOtp')
      .then((result)=>{
        if(result==true){
          res.statusCode=200
          res.setHeader('content-type','application/json')
          res.send({success:true,status:'OTP sent.'})
        }
        else throw new Error('error occured')
      })
      .catch((err)=>{
        res.statusCode=500
        res.setHeader('content-type','application/json')
        res.send({success:false,err:err})
      })
    }
  })
  .catch((err)=>{
    res.statusCode=500
    res.setHeader('content-type','application/json')
    res.send({success:false,err:err})
  })
})
router.route('/forgetPassword/changePassword')
.options(cors.corsWithOptions,(req,res)=>{res.statusCode(200)})
.post(cors.corsWithOptions,(req,res,next)=>{
  user.findOne({email:req.body.email})
  .then((User)=>{
    if(!User){
      res.statusCode=400
      res.setHeader('content-type','application/json')
      res.send({success:false,status:'Email not found.Please register first'})
    }
    else{
      if(req.body.otp!=User.forgetPasswordOtp || req.body.otp==-1){
        res.statusCode=400
        res.setHeader('content-type','application/json')
        res.send({success:false,status:'Wrong OTP'})
      }
      else{
        user.findOneAndUpdate({email:req.body.email},{$set:{forgetPasswordOtp:-1}},(err,User)=>{
          if(err){
            res.statusCode=500
            res.setHeader('content-type','application/json')
            res.send({success:false,err:err})    
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
      res.statusCode=400
      res.setHeader('content-type','application/json')
      res.send({success:false,status:'Email not found.Please register first'})
    }
    else if(User.verified==true){
      res.statusCode=400
      res.setHeader('content-type','application/json')
      res.send({success:false,status:'Email already verified.'})
    }
    else if(req.body.otp!=User.verifyOtp || req.body.otp==-1){
      res.statusCode=400
      res.setHeader('content-type','text/plain')
      res.send({success:false,status:'Wrong OTP'})
    }
    else{
      user.findOneAndUpdate({email:req.body.email},{$set:{verified:true,verifyOtp:-1}},(err,User)=>{
        if(err){
          res.statusCode=500
          res.setHeader('content-type','application/json')
          res.send({success:false,err:err})    
        }
        else{
          res.statusCode=200
          res.setHeader('content-type','application/json')
          res.send({success:true,status:'Email verified'})  
        }
      })
    } 
  })
  .catch((err)=>{
    res.statusCode=500
    res.setHeader('content-type','application/json')
    res.send({success:false,err:err})
  })
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
    res.setHeader('content-type','application/json')
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
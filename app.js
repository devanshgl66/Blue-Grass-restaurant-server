var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
//to save session in a file
const fileStore=require('session-file-store')(session);
const mongoose=require('mongoose');
const passport=require('passport');
const cors=require('cors')
require('./authenticate')


var indexRouter = require('./routes/index');
const dishRouter=require('./routes/dishRouter');
const promoRouter=require('./routes/promoRouter');
const leaderRouter=require('./routes/leaderRouter');
const userRouter=require('./routes/users');
const config=require('./config');
const feedbackRouter = require('./routes/feedback');
//connecting mongoose
mongoose.connect(config.mongodburl,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true,
    useFindAndModify:false
  });

var app = express();

// Secure traffic only
// app.all('*', (req, res, next) => {
//   if (req.secure) {
//     return next();
//   }
//   else {
//     res.redirect(307, 'https://' + req.hostname + ':' + app.get('secPort') + req.url);
//   }
// });


//setting cross origin request server
// app.use(cors({
//   origin:'http://localhost:3000',
//   credentials:true,
//   optionsSuccessStatus:200,
// }))
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(config.secretKey));

//Basic authentication
function Basicauth(req,res,next){
  console.log('\nReq: ');
  console.log(req.headers);
  var authHeader=req.headers.authorization;
  if(!authHeader){
    //nothing to authorize
    var err=new Error('You are not authorized.');
    err.status=401;
    res.setHeader('WWW-authentication','Basic');
    return next(err);
  }
  else{
    //authorization details are present so using it to authorize
    //authHeader contains Basic [username:password](in base 64 format) so extracting info
    var auth=new Buffer(authHeader.split(' ')[1],'base64').toString().split(':');
    var username=auth[0];
    var password=auth[1];
    if(username=='admin' && password=='pass'){
      //he is authorized to go ahead;
      next(); 
    }
    else{
      //wrong authorization details
      var err=new Error('You are not authorized.');
      err.status=401;
      res.setHeader('WWW-authentication','Basic');
      return next(err);
    }
  }
}
// // using basic authentication
// app.use(Basicauth);

//function to authorize user using cookie
function cookieauth(req,res,next){
  if(!req.signedCookies.user){
    //cookie.user not present so not not authorized yet;
    authHeader=req.headers.authorization;
    if(!authHeader){
      //no auth details passed to sending err
      var err=new Error('You are not authorized!');
      res.setHeader('WWW-authentication','Basic');
      err.status=401;
      return next(err);
    }
    else{
      //auth details present
      var auth=new Buffer.from(authHeader.split(' ')[1],'base64').toString().split(':');
      var user=auth[0];
      var pwd=auth[1];
      if(user=='admin' && pwd=='pass'){
        //rightly authorized;
        res.cookie('user','admin',{signed:true});
        next();
      }
      else{
        //auth details are wrong
        var err=new Error('You are not authorized!');
        res.setHeader('WWW-authentication','Basic');
        err.status=401;
        return next(err);
      }
    }
  }
  else{
    //cookie present
    if(req.signedCookies.user=='admin'){
      //allow through cookie if valid
      next();
    }
    else{
      //wrong cookie passed
      var err=new Error('You are not authorized!');
      res.setHeader('WWW-authentication','Basic');
      err.status=401;
      return next(err);
    }
  }
}
// //authorizing access using cookies
// app.use(cookieauth);

//using sessions
// app.use(session({
//   name:'session-id',
//   saveUninitialized:false,
//   resave:false,
//   store:new fileStore(),
//   secret:'12345-67890-09876-54321'
// }))
app.use(passport.initialize())
// app.use(passport.session())
//function to authorize using sessions
function sessionauth(req,res,next){
  console.log(req.session);
  if(!req.session.user){
    //no session made till now
    var authHeader=req.headers.authorization;
    if(!authHeader){
      //no auth details provided
      var err=new Error('You are not authorized!');
      err.status=401;
      return next(err);
    }
    else{
      //auth details provided
      //extracting auth details
      var auth=new Buffer.from(authHeader.split(' ')[1],'base64').toString().split(':');
      var username=auth[0];
      var pwd=auth[1];
      if(username=='admin' && pwd=='pass'){
        req.session.user='admin';
        console.log(username+" "+pwd);
        next();
      }
      else{
        var err=new Error('You are not authorized!');
        err.status=401;
        return next(err);
      }
    }
  }
  else{
    //session is already created
    if(req.session.user=='admin'){
      next();
    }
    else{
      var err=new Error('You are not authorized!');
      err.status=401;
      return next(err);
    }
  }
}
// //authenticated using sessions simple
// app.use(sessionauth);

//function to auth using passport

app.use(express.static(path.join(__dirname, 'public')));

// app.get('/*', function (req, res) {
//   console.log('ghl')
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.use('/', indexRouter);
app.use('/users', userRouter);

//authenticating using user router
function auth(req,res,next){
  if(!req.session.user){
    var err=new Error('You are not logged in!');
    err.status=403;
    return next(err);
  }
  else{
    if(req.session.user=='authenticated'){
      next();
    }
    else{
      var err=new Error('You are not authenticated!');
      err.status=403;
      return next(err);
    }
  }
}

// app.use(auth);

function authPassport(req,res,next){
  if(!req.user){
    var err=new Error('Log in first');
    err.status=401;
    return next(err);
  }
  else{
    next();
  }
}

// app.use(authPassport);


app.use('/dishes',dishRouter);
app.use('/promotions',promoRouter);
app.use('/leaders',leaderRouter);
app.use('/feedback',feedbackRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // console.log(err.message)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // console.log(err);
  res.setHeader("content-type","application/json")
  // render the error page
  res.status(err.status || 500);
  res.send({err:err.message});
});
app.listen(3000,()=>{
  console.log("server running")
})
module.exports = app;

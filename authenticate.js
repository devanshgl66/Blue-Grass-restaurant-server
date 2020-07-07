//It sets neccessary code to use local passport
const passport=require('passport');
const Localstratagy=require('passport-local').Strategy
const user=require('./modals/users');

exports.local=passport.use(new Localstratagy(
    //function to authenticate user
    //since passport plugin is used in user so it is very easy
    user.authenticate('local')
));

//For sessions
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

//using json web token 


const JwtStrategy=require('passport-jwt').Strategy
const ExtractJwt=require('passport-jwt').ExtractJwt
const jwt=require('jsonwebtoken')

const config=require('./config')

exports.getToken=function (user){
    return jwt.sign(user,config.secretKey,{
        expiresIn:'7d' //this token expires in 7days
    })
}
var cookieExtractor = (req)=> {
    var token = null;
    // console.log(req)
    if (req && req.signedCookies)
    {
        token = req.signedCookies['token'];
        jwt.verify(token,config.secretKey,(err,decoded)=>{
            // console.log('err',err)
            // console.log('decode',decoded)
            // if (err)
            //     req.clea
            // else
            //     return decoded._id
        })
    }
    console.log(token)
    return token;
};
var opts={}
opts.jwtFromRequest=ExtractJwt.fromExtractors([cookieExtractor]);
opts.secretOrKey = config.secretKey
//payload is the data in token
passport.use(new JwtStrategy(opts,(jwt_payload,done)=>{
    // console.log('hkk')
    // console.log(jwt_payload)
    user.findOne({_id:jwt_payload._id},(err,User)=>{
        console.log(err,User)
        if (err){
            // console.log('Invalid username or password')
            done(err,false)
        }
        else if(User){
            // console.log(User)
            done(null,User)
        }
        else
            done(null,false)
    })
}))


exports.verifyUser=(req,res,next)=>{
    var e=new Error();
    if (req && req.signedCookies)
    {
        token = req.signedCookies['token'];
        jwt.verify(token,config.secretKey,(err,decoded)=>{
            // console.log('err',err)
            // console.log('decode',decoded)
            if(err){
                res.clearCookie('token')
                res.statusCode=400
                res.setHeader('content-type','application/json')
                res.send({success:false,status:'You are logged out.Please log in again.'})
                // console.log('Error')
                // e.status=400
                // e.message='You are logged out.Please log in.'
                
            }
        })
    }
    if(e.message)
        next(e)
    else
        passport.authenticate('jwt',{session:false})(req,res,()=>next())
}
exports.verifyAdmin=(req,res,next)=>{
    //can be performed by admin only
    if(req.user.admin==false){
        var err=new Error('Unauthorized')
        next(err)
        // console.log('no')
        return false
    }
    else {
        // console.log('yes')
        next()
        return true
    }
}

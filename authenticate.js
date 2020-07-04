//It sets neccessary code to use local passport
const passport=require('passport');
const Localstratagy=require('passport-local').Strategy
const user=require('./modals/users');

exports.local=passport.use(new Localstratagy(
    //function to authenticate user
    //since passport plugin is used in user so it is very easy
    user.authenticate()
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
        expiresIn:360000 //this token expires in 100 hour
    })
}
var cookieExtractor = (req)=> {
    var token = null;
    if (req && req.signedCookies)
    {
        token = req.signedCookies['token'];
        jwt.verify(token,config.secretKey,(err,decoded)=>{
            if(err){
                console.log(err);
                //TODO:change it.
                return null
            }
        })
    }
    return token;
};
var opts={}
opts.jwtFromRequest=ExtractJwt.fromExtractors([cookieExtractor]);
opts.secretOrKey = config.secretKey
//payload is the data in token
passport.use(new JwtStrategy(opts,(jwt_payload,done)=>{
    user.findOne({_id:jwt_payload._id},(err,User)=>{
        if (err)
            done(err,false)
        else if(User)
            done(null,User)
        else
            done(null,false)
    })
}))


exports.verifyUser=passport.authenticate('jwt',{session:false})
exports.verifyAdmin=(req,res,next)=>{
    //can be performed by admin only
    if(req.user.admin==false){
        var err=new Error('Unauthorized')
        next(err)
        console.log('no')
        return false
    }
    else {
        console.log('yes')
        next()
        return true
    }
}

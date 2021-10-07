const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const clientID=require('../config/googleauth')
const clientSecert=require('../config/googleauth')

passport.use(new GoogleStrategy({
    clientID: clientID,  //367337184905-5g58ji2bdun23ep367986hqrnonn7tfm.apps.googleusercontent.com
    clientSecret: clientSecert,  //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
    callbackURL: "http://localhost:3000/google/callabck",
    passReqToCallback:true
  },
  function(accessToken, refreshToken, profile, cb) {
   // User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
  //  });
  }
))

passport.serializeUser(function(user,done){
    done(null,user)
})

passport.deserializeUser(function(user,done){
    done(null,user)
})
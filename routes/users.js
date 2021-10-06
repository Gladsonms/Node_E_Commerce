var express = require('express');
const { restart } = require('nodemon');
var router = express.Router();
var userHelper = require("../helpers/user-helpers")

const checkUserAuth=(req,res,next)=>{
if(req.session.isLoggedIn){
  res.render('user/index')
}
else{
  next()
}
}
/* GET users listing. */
router.get('/',checkUserAuth, function (req, res, next) {
  let user=req.session.user
 // console.log(user);
  res.render('user/index',{user});
});
router.get('/login', function (req, res, next) {
  res.render('user/login')
})
router.get('/signup', function (req, res, next) {
  res.render('user/signup')
})
router.post('/signup', function (req, res, next) {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
     res.redirect('/login')
  })
})
router.post('/login', function (req, res, next) {
  console.log("got it 1");
  userHelper.doLogin(req.body).then((response) => {
    console.log("got it");
      //  console.log("new check"+user);
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user
      console.log(req.session.loggedIn);

      res.redirect('/')

    } else {

      res.render('user/login',{err:"Invalid email or password"});
    }

  })
})
router.post('/logout',function (req,res,next){
  req.session.destroy()
  res.header('Cache-control','private, no-cache,no-store,max-age=0,must-revalidate,pre-check=0,post-check=0')
  res.redirect('/login')
})

module.exports = router;

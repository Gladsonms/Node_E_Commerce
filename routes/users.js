var express = require('express');
var router = express.Router();
var userHelper = require("../helpers/user-helpers")

/* GET users listing. */
router.get('/', function (req, res, next) {
  let user=req.session.user
  console.log(user);
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
  })
})
router.post('/login', function (req, res, next) {
  console.log("got it 1");
  userHelper.doLogin(req.body).then((response) => {
    console.log("got it");

    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user
      console.log(req.session.loggedIn);

      res.redirect('/')

    } else {

      res.redirect('/login');
    }

  })
})
router.post('/logout',function (req,res,next){
  req.session.destroy()
  res.header('Cache-control','private, no-cache,no-store,max-age=0,must-revalidate,pre-check=0,post-check=0')
  res.redirect('/login')
})

module.exports = router;

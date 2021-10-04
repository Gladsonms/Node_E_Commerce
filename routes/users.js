var express = require('express');
var router = express.Router();
var userHelper=require("../helpers/user-helpers")

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('user/index');
});
router.get('/login',function(req,res,next){
  res.render('user/login')
})
router.get('/signup',function(req,res,next){
  res.render('user/signup')
}) 
router.post('/signup',function(req,res,next){
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response);
  })
})
router.post('/login',function(req,res,next){
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      res.redirect('/')
    }
    else {
      res.redirect('/login')
    }
  })
})
module.exports = router;

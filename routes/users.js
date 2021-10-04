var express = require('express');
var router = express.Router();

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
module.exports = router;

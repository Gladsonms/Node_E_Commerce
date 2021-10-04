var express = require('express');
var router = express.Router();

var adminUsername="admin";
var adminPassword ="admin";

router.get('/', function(req, res, next) {
  // if(req.session.isLoggedIn)
  // {
    
    // res.redirect("/admin/home")
  // }
  // else
  // {

    res.render('admin/adminlogin',{rejectHeader:true});
    //res.header('Cache-control','private, no-cache,no-store,max-age=0,must-revalidate,pre-check=0,post-check=0')
  //}

});
router.post('/adminLogin',function(req,res,next){

  if(adminUsername==req.body.username && adminPassword==req.body.password)
  { 
    req.session.username=adminUsername;
    req.session.password=adminPassword;
    req.session.isLoggedIn=true;
    console.log("login succes");
    res.redirect('/admin/home')
   
  }else{
    console.log("login failed");
    res.render('admin/adminlogin',{rejectHeader:true})
  }

})
router.get('/home', function(req, res, next) {
  res.render('admin/home',{admin:true});
});

module.exports = router;

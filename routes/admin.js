const { response } = require('express');
var express = require('express');
const userHelpers = require('../helpers/user-helpers');
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
    console.log(req.session.isLoggedIn);
   
  }else{
    console.log("login failed");
    res.render('admin/adminlogin',{rejectHeader:true})
  }

})
router.get('/home', function(req, res) {
  res.render('admin/home',{admin:true});
});
router.get('/usermanagment',function(req,res){
  userHelpers.getUserDetails().then((users)=>{
    console.log("sdhjksdsdsdsdsad");
    console.log(users);
    res.render('admin/userManagment',{admin:true,users})
   
  }).catch((err)=>{
    console.log(err);
  })
});
router.get('/usermanagment/disableuser',async(req,res)=>{
  let userId=req.query.id
  console.log(userId);
  let user=await userHelpers.disableUser(userId)

})
router.post('/usermanagment/disableuser',async(req,res)=>{
  console.log(req.query.id);
  console.log("got it");
  userHelpers.disableUser(req.params.id,req.body).then(()=>{
    console.log("user disabled");
  })
})
router.get('/usermanagment/enableuser',async(req,res)=>{
 
  let userId=req.query.id
  console.log(userId);
  let user=await userHelpers.enableUser(userId)

})
router.post('/usermanagment/enableuser',async(req,res)=>{
  console.log(req.query.id);
  console.log("Enable page poat");
  userHelpers.enableUser(req.params.id,req.body).then(()=>{
    console.log("user enabled succesfully");
  })
})
router.get('/productmanagment',function(req,res){
res.render('admin/productsManagment',{admin:true})
})
router.get('/productmanagment/adddproduct',function(req,res){
  res.render('admin/addProducts',{admin:true})
})
router.post('/productmanagmnet/addproduct',function(req,res){
  console.log(req.body);
})
module.exports = router;

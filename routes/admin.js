const { response } = require('express');
var express = require('express');
const session = require('express-session');
const userHelpers = require('../helpers/user-helpers');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();

const checkAuth = (req, res, next) => {
  if (req.session.isLoggedIn) {
    res.render('admin/home', { admin: true });
  }
  else {
    next()
  }
}

var adminUsername = "admin";
var adminPassword = "admin";

//login
router.get('/', checkAuth, function (req, res, next) {

  res.render('admin/adminlogin', { rejectHeader: true });


});
router.post('/adminLogin', function (req, res, next) {

  if (adminUsername == req.body.username && adminPassword == req.body.password) {
    req.session.username = adminUsername;
    req.session.password = adminPassword;
    req.session.isLoggedIn = true;
    console.log("login succes");
    res.redirect('/admin/home')
    console.log(req.session.isLoggedIn);

  } else {
    console.log("login failed");
    res.render('admin/adminlogin', { rejectHeader: true })
  }

})

//home
router.get('/home', function (req, res) {
  res.render('admin/home', { admin: true });
});

//usermangment
router.get('/usermanagment', function (req, res) {
  userHelpers.getUserDetails().then((users) => {

    res.render('admin/userManagment', { admin: true, users })

  }).catch((err) => {
    console.log(err);
  })
});

router.post('/usermanagment/disableuser', async (req, res) => {

  userHelpers.disableUser(req.query.id, req.body).then((response) => {

    res.redirect('/admin/usermanagment');
  })
})

router.post('/usermanagment/enableuser', async (req, res) => {

  userHelpers.enableUser(req.query.id, req.body).then(() => {

    res.redirect('/admin/usermanagment')
  })
})

//product mangment
router.get('/productmanagment', function (req, res,next) {
  
  productHelpers.getAllProducts().then((products)=>{
    console.log(products );
    res.render('admin/productsManagment', { admin: true ,products})
  })
})

router.post('/productmangment/deleteproduct/:id',function (req,res,next){
  console.log('came ')
  let productId=req.params.id
  console.log(productId);
 
    productHelpers.deleteProduct(productId).then((response)=>{
    res.render('admin/productsManagment', { admin: true })
  })
})

router.get('/productmanagment/adddproduct', function (req, res) {
  res.render('admin/addProducts', { admin: true })
})
router.post('/productmanagmnet/addproduct', function (req, res) {
  productHelpers.addProduct(req.body).then((data)=>{

    let id=""+data
    let image1 =req.files.productimage1;
    let image2 =req.files.productimage2;
    let image3=req.files.productimage3;
    let image4 =req.files.productimage4;
    image1.mv('./public/product-images/product-image1/'+id+'.jpg')
    image2.mv('./public/product-images/product-image2/'+id+'.jpg')
    image3.mv('./public/product-images/product-image3/'+id+'.jpg')
    image4.mv('./public/product-images/product-image4/'+id+'.jpg')  
    res.render('admin/addProducts', { admin: true })
  })
  })


  //category mangmnet
router.get('/categorymangament', function (req, res) {
  res.render('admin/categoryManagment', { admin: true })
})


//logout
router.get('/logout', function (req, res) {
  req.session.isLoggedIn = false;
  req.session.destroy()
  res.redirect('/admin/adminLogin')
})
module.exports = router;

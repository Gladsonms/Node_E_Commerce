var express = require('express');
const { restart } = require('nodemon');
var router = express.Router();
var userHelper = require("../helpers/user-helpers")
const productHelpers = require('../helpers/product-helpers');
require('../helpers/auth')
const passport=require('passport');
const {OAuth2Client} = require('google-auth-library');
const  CLIENT_ID = "367337184905-5g58ji2bdun23ep367986hqrnonn7tfm.apps.googleusercontent.com"
const client = new OAuth2Client(CLIENT_ID);
const userHelpers = require('../helpers/user-helpers');
const { session } = require('passport');
const checkUserAuth=(req,res,next)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    next()
  }
  
  }
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};


/* GET users listing. */
router.get('/' ,async function (req, res, next) {
  let user=req.session.user
  
 
  console.log(cartCount);
  if(req.session.user)
  {

    var cartCount=await userHelpers.getCartCount(req.session.user._id)
  } 
  productHelpers.getAllProducts().then(async(products)=>{
    console.log(products.product);
    console.log(cartCount);
   
    res.render('user/index',{user,products,cartCount});
  })
   

});
router.get('/login',checkUserAuth, function (req, res, next) {
  res.render('user/login')
})
router.get('/signup', function (req, res, next) {
  res.render('user/signup')
})
router.post('/signup', function (req, res, next) {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
     res.redirect('/login')
    //  req.session.loggedIn = true;
    //  req.session.user = response
    //  res
  })
})
router.post('/login', function (req, res, next) {
  
  userHelper.doLogin(req.body).then((response) => {
  
      //  console.log("new check"+user);
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user
      req.session.user_id=response._id
      console.log(req.session.loggedIn);

      res.redirect('/')

    } else {

      res.render('user/login',{err:"Invalid email or password"});
    }

  })
})
function checkAuthenticated(req, res, next){

  let token = req.cookies['session-token'];

  let user = {};
  async function verify() {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      });
      const payload = ticket.getPayload();
      user.name = payload.name;
      user.email = payload.email;
      user.picture = payload.picture;
    }
    verify()
    .then(()=>{
        req.user = user;
        next();
    })
    .catch(err=>{
        res.redirect('/login')
    })

}

router.post('/googlelogin',checkAuthenticated,(req,res)=>{
  
  let token = req.body.token
  
  async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    console.log(payload);
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
  }
  verify()
  .then(()=>{
    res.cookie('session-token',token);
    res.send('SUCCESS')
  }).catch(console.error);
})



router.post('/logout',function (req,res,next){
  //req.session.destroy()
  //res.clearCookie('session-token')
     req.session.user = null;
    req.session.loggedIn=false; 
  res.redirect('/login')
})


router.get('/productdetails/:id',async function (req,res,next){
let products= await productHelpers.getProductDetails(req.params.id)
console.log(products);
  res.render('user/productDetails',{products})

  
})

//cart
router.get('/cart',async (req,res)=>{
  let products=await userHelpers.getCartProducts(req.session.user._id)
   console.log("product in cart start");
   console.log(products);
   console.log("product in cart end");
  res.render('user/cart',{products,user:req.session.user})
  console.log(req.session.user);
})



router.get('/add-to-cart/:id',(req,res)=>{
  console.log("ajax api caall");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.get('/cart/checkout',(req,res)=>{
  
  res.render('user/checkout')
})
module.exports = router;

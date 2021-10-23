var express = require("express");
const { restart } = require("nodemon");
var router = express.Router();
var userHelper = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
require("../helpers/auth");
const passport = require("passport");

const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID =
  "367337184905-5g58ji2bdun23ep367986hqrnonn7tfm.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const userHelpers = require("../helpers/user-helpers");
const { session } = require("passport");
const { Router, response } = require("express");

const serviceSSID = "VAaaa09725d9a25b6fa22c1e395362b716";
const accountSSID = "ACebbf9a771b4b998c20ba75f79b99372c";
const authToken = "61193b2f815c88755989d1e8050a2094";
const clientTwillo = require("twilio")(accountSSID, authToken);

const checkUserAuth = (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    next();
  }
};
const verifyLogin = async(req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
   await productHelpers.getAllProducts().then(async (products) => {
  
      res.render("user/index", {  products });
    });
  }
};

/* GET users listing. */
router.get("/", verifyLogin, async function (req, res, next) {
  let user = req.session.user;

  
  if (req.session.user) {
    var cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelpers.getAllProducts().then(async (products) => {
  
    res.render("user/index", { user, products, cartCount });
  });
});
router.get("/login", checkUserAuth, function (req, res, next) {
  res.render("user/login");
});
router.get("/signup", function (req, res, next) {
  res.render("user/signup");
});
router.post("/signup", function (req, res, next) {
  userHelper.doSignup(req.body).then((response) => {
    
    res.redirect("/login");
    //  req.session.loggedIn = true;
    //  req.session.user = response
    //  res
  });
});
router.post("/login", function (req, res, next) {
  userHelper.doLogin(req.body).then((response) => {
    //  console.log("new check"+user);
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      req.session.user_id = response._id;
     

      res.redirect("/");
    } else {
      res.render("user/login", { err: "Invalid email or password" });
    }
  });
});




router.post('/googlelogin',async(req,res)=>{
  
  let token = req.body.token
  console.log(token);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, 
  });
  const payload = ticket.getPayload();
  console.log(payload);
const user = await userHelpers.getUserByEmail(payload.email)
if(user){
  console.log('user:', user);
  if(!user.status){
    res.render("user/login", { err: "Blocked User" });
  }
  else{
    req.session.user = user
    req.session.loggedIn = true
    res.redirect('/')

  }
}else{
const createdUser = await userHelpers.addGoogleUser(payload.email, payload.given_name)
console.log('createdUser:', createdUser);
req.session.user = createdUser
req.session.loggedIn = true
req.session.user_id = user._id
res.redirect('/')
}
  } catch (error) {
    
  }
      
   
  
  })





//vserify otp
router.get("/verifyotp", (req, res) => {
  res.render("user/otpVerify");
});

router.post("/verifyotp", (req, res) => {
  
  let number = req.body.phone;
  
  req.session.number = number;
  

  clientTwillo.verify
    .services(serviceSSID)
    .verifications.create({ to: `+91${number}`, channel: "sms" })
    .then((verification) => console.log(verification.status));
  
  res.redirect("/confirmotp");
});

router.get("/confirmotp", (req, res) => {
  res.render("user/enterOtp");
});
router.post("/enterOtp", (req, res) => {
  let otp = req.body.otp;
  
  
  let number = req.session.number;
  

  
  userHelpers.checkNumber(number).then((response)=>{
    
     
     req.session.user = response;
     req.session.user_id = response._id;

     
  })
  clientTwillo.verify
    .services(serviceSSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: `${otp}`,
    })
    .then((resp) => {
     
      req.session.loggedIn = true;
     
        
      res.redirect("/");
     
      
      
    });

});



router.get("/logout", function (req, res, next) {
  req.session.loggedIn = false;
  delete req.session.loggedIn;

  res.redirect("/");
});

router.get("/about",function(req,res,next){
  res.render("user/aboutus")
})

router.get("/productdetails/:id",verifyLogin, async function (req, res, next) {
  
  let products = await productHelpers.getProductDetails(req.params.id);
  
  res.render("user/productDetails", { products });
});

//cart
router.get("/cart", verifyLogin, async (req, res) => {
  
  let products = await userHelpers.getCartProducts(req.session.user._id);
  if(products.length!=0)
  {
    
  let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
  let subtotal = await userHelpers.getSubTotal(req.session.user._id)
  
  products = products.map((i,index)=>{return {...i,subtotal:subtotal[index]}})

  res.render("user/cart", { products, user: req.session.user, totalAmount });
  }
  else {

    res.render("user/cartempty")
  }
});
  

    

//  response.total= await userHelpers.getTottalAmount(req.body.user)

router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  
  userHelpers.changeProductQauntity(req.body).then(async (response) => {
    res.json(response);
  });
});

router.get("/cart/checkout", verifyLogin, async (req, res) => {
  let total = await userHelpers.getTottalAmount(req.session.user._id);
  let useraddres = await userHelpers.getUserAddress(req.session.user._id)
  
  res.render("user/checkout", { total, user: req.session.user, useraddres});
});

router.post("/remove-item", verifyLogin,async  (req, res) => {
  
  let cartId = req.body.cartId;
  let item = req.body.proId

  await userHelpers.deleteCartProduct(cartId, item).then((response) => {
    res.json({response})
  });
});

router.post("/cart/checkout/addAddress", (req, res) => {
  let userId=req.session.user._id
  let address=req.body
 
  userHelpers.addAddress(userId,address).then((response)=>{

    res.redirect("/")
  })
 
  

});


router.post("/place-order",async(req,res)=>{


let product=await userHelpers.getCartProductList(req.session.user._id)
let totalAmount= await userHelpers.getTottalAmount(req.body.userId)

   
  
   userHelpers.PlaceOrder(req.body,product,totalAmount).then((orderId)=>{
     console.log(orderId);
     console.log(req.body);
    if(req.body['payment']=='cod'){

      res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorPay(orderId,totalAmount).then((response)=>{
        res.json(response)

      })
    }

  // res.redirect("/order-success")

  })

  
    
})


router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get("/orders",verifyLogin,async (req,res)=>{
   
 
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  console.log(orders.status)
  res.render('user/odersList',{user:req.session.user,orders})
 
})
router.get('/view-order-product/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  
  
  res.render('user/userorder',{user:req.session.user,products})
})
router.post('/oders/cancelorder/:id',async(req,res)=>{
  let orderId=req.params.id
  userHelpers.cancelOrder(orderId)
})

router.post("/oders/deleteaddress",(req,res)=>{
  
   
   uaddress=req.body.address
   uname=req.body.name
   addId=req.body.addressId
   userId=req.session.user._id
   
  //  console.log("address");
  //  console.log(addId);
userHelpers.deleteAdddress(uaddress,userId,addId,uname).then((response)=>{
      res.redirect("/cart/checkout")
})

})

router.post("/verify-payment",(req,res)=>{
console.log(req.body);
userHelpers.verifyPayment(req.body).then(()=>{
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    console.log("Payment succesfull");
    res.json({status:true})
  })
}).catch((err)=>{
  console.log(err);
  res.json({status:flase,errMsg:''})
})
})

router.get('/contact',(req,res)=>{
  res.render("user/contact")
})

module.exports = router;

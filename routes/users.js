var express = require("express");
const { restart } = require("nodemon");
var router = express.Router();
var userHelper = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
require("../helpers/auth");
const passport = require("passport");


//Google auth
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID =
  "367337184905-5g58ji2bdun23ep367986hqrnonn7tfm.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const userHelpers = require("../helpers/user-helpers");
const { session } = require("passport");
const { Router, response } = require("express");

//paypal interggreation
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AWp1ywqyrlAJ8UAwiDeqJRu77Mr80YUAoKV862hKJ8gLsLmMk1BNhTB-BwrSzEJcfZJiZ3Z4Bla9rghu',
  'client_secret': 'EH9c4LHAFuIlIuciPsDhOUhpaRdwHsYV7kcj3andfpPlgARK0jw6-uJ4vp7Xibwf4dNX2akfeoImPyw_'
});


//Twillo otp login
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
   
   let category=await productHelpers.getCategory()
    let  offerProduct=productHelpers.getOfferProduct() 
   await productHelpers.getAllProducts().then(async (products) => {
        
      res.render("user/index", {user:false, products,category,offerProduct });
    });
    //res.redirect("/login")
  }
};

/* GET users listing. */
router.get("/", verifyLogin, async function (req, res, next) {
  let user = req.session.user;

  
  if (req.session.user) {
    var cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let category=await productHelpers.getCategory()
  productHelpers.getAllProducts().then(async (products) => {
    let  offerProduct=productHelpers.getOfferProduct()
    
    res.render("user/index", { user, products, cartCount, category,offerProduct});
  });
});
router.get("/login", function (req, res, next) {
  res.render("user/login");
});
router.get("/signup", function (req, res, next) {
  res.render("user/signup");
});
router.post("/signup", function (req, res, next) {
  userHelper.doSignup(req.body).then((response) => {
    
    res.redirect("/login");
  
  });
});
router.post("/login", function (req, res, next) {
  
  userHelper.doLogin(req.body).then((response) => {
  
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
  

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, 
  });
  const payload = ticket.getPayload();
  
const user = await userHelpers.getUserByEmail(payload.email)
if(user){
  
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
  delete req.session.user;

  res.redirect("/");
});

router.get("/about",function(req,res,next){
  res.render("user/aboutus")
})

router.get("/productdetails/:id",verifyLogin, async function (req, res, next) {
  
  let category=await productHelpers.getCategory()
  let products = await productHelpers.getProductDetails(req.params.id);
  
  res.render("user/productDetails", { products,category });
});

//cart
router.get("/cart", verifyLogin, async (req, res) => {
  
  console.log(req.session.user);
  let products = await userHelpers.getCartProducts(req.session.user._id);
  if(products.length!=0)
  {
    
  let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
  // let subtotal = await userHelpers.getSubTotal(req.session.user._id)
  let totalPrice =0

  for(var i in totalAmount){
    totalPrice = totalPrice + totalAmount[i].subtotal
  }
  //products = products.map((i,index)=>{return {...i,subtotal:subtotal[index]}})

  res.render("user/cart", { products, user: req.session.user, totalAmount,totalPrice });
  }
  else {

    res.render("user/cartempty")
  }
});
  

    

//  response.total= await userHelpers.getTottalAmount(req.body.user)

router.get("/add-to-cart/:id", (req, res) => {
  // console.log(req.session.user)
  
  
  if(req.session.user){
   
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true });
    });
    
   
}
else{
  
  res.json({status:false})
  }
});

router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  
  userHelpers.changeProductQauntity(req.body).then(async (response) => {
    
    let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
   
    let totalPrice =0
  
    for(var i in totalAmount){
      totalPrice = totalPrice + totalAmount[i].subtotal
    }
    console.log("totalPrice: " + totalPrice);
    response.total=totalPrice
    console.log(response);
    res.json(response);
  });
});

router.get("/cart/checkout", verifyLogin, async (req, res) => {
 // let total = await userHelpers.getTottalAmount(req.session.user._id);
  let useraddres = await userHelpers.getUserAddress(req.session.user._id)
  let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
  // let subtotal = await userHelpers.getSubTotal(req.session.user._id)
  let totalPrice =0

  for(var i in totalAmount){
    totalPrice = totalPrice + totalAmount[i].subtotal
  }
  
  res.render("user/checkout", {  user: req.session.user, useraddres,totalAmount,totalPrice});
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

    res.redirect("/cart/checkout")
  })
 
  

});
  router.post("/delete-cart-product",(req,res)=>{
   
    userId=req.session.user._id;
    userHelpers.deleteFinalCart(userId).then((response)=>{

    res.json({response:true})
    })
  })

router.post("/place-order",async(req,res)=>{
  
 let coupon = req.body.couponCode;
 let newPrice;
 //GET TOTTAL AMOUNT
  let response =await userHelpers.checkCoupon(coupon)
    //let couponId = response._id

    
   if(response){
    let minAmount=response.minAmount;
   
    let totalAmount= await userHelpers.getTottalAmount(req.session.user._id)
    let totalPrice=0 ;
    
    for(var i in totalAmount){
      totalPrice = totalPrice + totalAmount[i].subtotal
    }
    
    console.log("totalPrice");
    console.log(totalPrice);
     if(totalPrice>=minAmount)

     {
      
       let discount =parseInt(response.discount)
       newPrice = Math.round(totalPrice-(totalPrice*discount/100))
       console.log("newPrice");
      console.log(newPrice);
      
      productHelpers.saveUserCoupon(req.session.user._id,response._id)
     }
     else
     {
      let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
     
      let totalPrice =0
    
      for(var i in totalAmount){
        totalPrice = totalPrice + totalAmount[i].subtotal
      }
       newPrice=totalPrice
     }
  }
  else{
    let totalAmount= await userHelpers.getTottalAmount(req.session.user._id)
    let totalPrice=0 ;
    
    for(var i in totalAmount){
      totalPrice = totalPrice + totalAmount[i].subtotal
    }
    
    console.log("totalPrice");
    console.log(totalPrice);
    newPrice=totalPrice
  }
 
let product=await userHelpers.getCartProductList(req.session.user._id)
//let coupon=userHelpers.checkCoupon(req.body)
//let totalAmount= await userHelpers.getTottalAmount(req.session.user._id)
let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
  // let subtotal = await userHelpers.getSubTotal(req.session.user._id)
  
  
 
   let user=req.session.user
   let userId=req.session.user._id
   userHelpers.PlaceOrder(user._id,req.body,product,newPrice).then((orderId)=>{
    
    if(req.body['payment']=='cod'){
     
             
      res.json({codSuccess:true})
      //RAXORPAY
    }else if (req.body['payment']=='razorpay'){
      
      userHelpers.generateRazorPay(orderId,newPrice,userId).then((response)=>{
        
        res.json({data:response, razorpaySuccess:true})

      })
    }else if (req.body['payment']=='paypal'){
      const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/order-success",
            // "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": newPrice,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": newPrice
            },
            "description": "Hat for the best team ever"
        }]  
    };
    
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          for(let i = 0;i < payment.links.length;i++){
            if(payment.links[i].rel === 'approval_url'){
              res.json(payment.links[i].href);
            }
          }
      }
    });
    
    }
  // res.redirect("/order-success")
  }).catch(err=>console.log(err))
})

router.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "25.00"
        }
    }]
      };

      userHelpers.deleteCartPaypal(req.session.user._id)

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        res.send('Success');
    }
});

});

router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/cancel', (req, res) => res.send('Cancelled'));





router.get("/orders",verifyLogin,async (req,res)=>{
   
 
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  //  let orderStatus=await userHelpers.getOrderStatus(req.session.user._id)
  //  console.log("orderstatus");
  //  console.log(orderStatus);
  res.render('user/odersList',{user:req.session.user,orders})
 
})
router.get('/view-order-product/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  
  
  res.render('user/userorder',{user:req.session.user,products})
})
router.post('/oders/cancelorder/:id',async(req,res)=>{
  let orderId=req.params.id
  await userHelpers.cancelOrder(orderId).then((response)=>{
    console.log(response);
    res.json(response)
  })

})

router.post("/oders/deleteaddress",(req,res)=>{
  
      
   uaddress=req.body.address
   uname=req.body.name
   addId=req.body.addressId
   userId=req.session.user._id
   
  
userHelpers.deleteAdddress(uaddress,userId,addId,uname).then((response)=>{
         
  res.json({response});
})

})

router.post("/verify-payment",(req,res)=>{

userHelpers.verifyPayment(req.body).then(()=>{
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{

    res.json({status:true})
  })
}).catch((err)=>{

  res.json({status:false,errMsg:''})
})
})

router.post('/apply-coupon',async (req,res)=>{
  let coupon=req.body.coupon
  let userId=req.session.user._id
  
 userHelpers.checkCoupon(coupon).then(async(response)=>{
  
    if(response)
    { 
    
     
      let totalAmount = await userHelpers.getTottalAmount(req.session.user._id)
      let totalPrice =0
    
      for(var i in totalAmount){
        totalPrice = totalPrice + totalAmount[i].subtotal
      }
      let minAmount=response.minAmount
      if(totalPrice>=minAmount)
       {
        let discount =parseInt(response.discount)
       
        let newPrice = Math.round(totalPrice-(totalPrice*discount/100))
        
       
       res.json({newPrice,couponMessage:true,message:"Coupon Applied"})
       }
       else
       {
        res.json({couponMessage1:true,Amessage:"Coupon   valid for this purshase above" +minAmount})
       }
       
      
      // userHelpers.CheckUserCoupon(coupon,userId).then((response)=>{
      //   console.log("check user coupon");
      //   console.log(coupon);
      // })
    }
    else{
      res.json({couponMessage2:true,Invalidmessage:"Coupon not  valid "})
    }
    
  })
  

})

router.get('/contact',(req,res)=>{
  res.render("user/contact")
})
router.get('/profile',verifyLogin,async(req,res)=>{
 let user = await userHelpers.getUserProfile(req.session.user._id)
 let useraddres = await userHelpers.getUserAddress(req.session.user._id)
 
  res.render('user/userProfile',{user,useraddres})
})
router.post('/pay', (req, res) => {
  
});




router.post('/profile/user-details',(req,res)=>{
let   name=req.body.username
let phone=req.body.phone
let email=req.body.email
let userId=req.session.user._id
userHelpers.updateUserInfo(name,phone,email,userId).then((response)=>{
     
  res.json({status:true})
})

})


router.post('/change-password',(req,res)=>{
let oldPass=req.body.oldpassowrd
let userId=req.session.user._id
let newPass=req.body.newpassword

userHelpers.CheckPassword(oldPass,userId,newPass).then(()=>{
  res.redirect("/profile")
})

})
router.get("/category/:category",async(req, res)=>{
 
 let categoryProduct=await productHelpers.getCategoryProduct(req.params.category)

  res.render("user/CategoryProduct",{categoryProduct})
})
module.exports = router;

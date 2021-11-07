var express = require("express");
 
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
var paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AWp1ywqyrlAJ8UAwiDeqJRu77Mr80YUAoKV862hKJ8gLsLmMk1BNhTB-BwrSzEJcfZJiZ3Z4Bla9rghu",
  client_secret:
    "EH9c4LHAFuIlIuciPsDhOUhpaRdwHsYV7kcj3andfpPlgARK0jw6-uJ4vp7Xibwf4dNX2akfeoImPyw_",
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
const verifyLogin = async (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    let category = await productHelpers.getCategory();
    let offerProduct = productHelpers.getOfferProduct();
    await productHelpers.getAllProducts().then(async (products) => {
      res.render("user/index", {
        user: false,
        products,
        category,
        offerProduct,
      });
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
  let category = await productHelpers.getCategory();
  productHelpers.getAllProducts().then(async (products) => {
    let offerProduct = productHelpers.getOfferProduct();

    res.render("user/index", {
      user,
      products,
      cartCount,
      category,
      offerProduct,
    });
  });
});
//login
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
  // console.log(req.body);
  userHelper.doLogin(req.body).then((response) => {
    
    if (response.status) {
    
      req.session.loggedIn = true;
      req.session.user = response.user;
      req.session.user_id = response._id;
      let newUserCart;
      if(req.session.noUserCart)
        {
          
          newUserCart =req.session.noUserCart
        }
       
        res.json({status:true,newUserCart})

    } else {
      res.json({ status:false });
    }
  });
});

router.post("/googlelogin", async (req, res) => {
  let token = req.body.token;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const user = await userHelpers.getUserByEmail(payload.email);
    if (user) {
      if (!user.status) {
        res.render("user/login", { err: "Blocked User" });
      } else {
        req.session.user = user;
        req.session.loggedIn = true;
        res.redirect("/");
      }
    } else {
      const createdUser = await userHelpers.addGoogleUser(
        payload.email,
        payload.given_name
      );

      req.session.user = createdUser;
      req.session.loggedIn = true;
      req.session.user_id = user._id;
      res.redirect("/");
    }
  } catch (error) {}
});

//vserify otp
router.get("/verifyotp", (req, res) => {
  res.render("user/otpVerify");
});

router.post("/verifyotp", (req, res) => {
  
  let number = req.body.number;
 
  req.session.number = number;
  
  userHelpers.checkNumber(number).then((response) => {
    console.log(response);
    if(response){

      clientTwillo.verify
      .services(serviceSSID)
      .verifications.create({ to: `+91${number}`, channel: "sms" })
      .then((verification) => console.log(verification.status));
       
       res.json({number: true})
    }else {
           res.json({number: false})
    }

  
  })
  

 
});

// router.get("/confirmotp", (req, res) => {
//   res.render("user/enterOtp");
// });
router.post("/enterOtp", (req, res) => {
  let otp = req.body.otp;

  let number = req.session.number;

  userHelpers.checkNumber(number).then((response) => {
    req.session.user = response;
    req.session.user_id = response._id;
  });
  clientTwillo.verify
    .services(serviceSSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: `${otp}`,
    })
    .then((resp) => {
      req.session.loggedIn = true;
        res.json({resp})
        console.log(resp)
      // res.redirect("/");
    });
});

//signup page otp

router.post('/sentOtp',(req, res) => {
  let number = req.body.number;
 
  req.session.number = number;
  
  userHelpers.checkNumber(number).then((response) => {
    console.log(response);
    if(!response){

      clientTwillo.verify
      .services(serviceSSID)
      .verifications.create({ to: `+91${number}`, channel: "sms" })
      .then((verification) => console.log(verification.status));
       
       res.json({number: true})
    }else {
           res.json({number: false})
    }

  
  })
})

router.post('/submitOtp',(req, res)=>{
  let otp = req.body.otp;

  let number = req.session.number;

  userHelpers.checkNumber(number).then((response) => {
    req.session.user = response;
    req.session.user_id = response._id;
  });
  clientTwillo.verify
    .services(serviceSSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: `${otp}`,
    })
    .then((resp) => {
      console.log(resp);
     if(resp.valid == true && resp.status == 'approved'){
       res.json({login : true})
     }
     else {
       res.json({login : false})
     }
    });
})

router.get("/logout", function (req, res, next) {
  req.session.user = null;
  req.session.loggedIn = false;

  res.redirect("/");
});

router.get("/about", async function (req, res, next) {
  let category = await productHelpers.getCategory();
  res.render("user/aboutus", { category });
});

router.get("/productdetails/:id", verifyLogin, async function (req, res, next) {
  let category = await productHelpers.getCategory();
  let products = await productHelpers.getProductDetails(req.params.id);
  let user = req.session.user._id;
  var cartCount = await userHelpers.getCartCount(req.session.user._id);

  res.render("user/productDetails", { products, category, user, cartCount });
});

//cart
router.get("/cart", verifyLogin, async (req, res) => {
  var cartCount = await userHelpers.getCartCount(req.session.user._id);
  let products = await userHelpers.getCartProducts(req.session.user._id);
  if (products.length != 0) {
    let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
    // let subtotal = await userHelpers.getSubTotal(req.session.user._id)
    let totalPrice = 0;

    for (var i in totalAmount) {
      totalPrice = totalPrice + totalAmount[i].subtotal;
    }

    let subtotal;

    for (var i in totalAmount) {
      subtotal = totalAmount[i].subtotal;
      products[i].product = { ...products[i].product, subtotal: subtotal };
    }

    res.render("user/cart", {
      products,
      user: req.session.user,
      totalAmount,
      totalPrice,
      cartCount,
    });
  } else {
    res.render("user/cartempty");
  }
});

//add to cart after login

router.get("/add-to-cart/:id", (req, res) => {
  
  if (req.session.user) {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      
      if(req.session.noUserCart){
        delete req.session.noUserCart
        res.redirect("/cart")
      }else{
        res.json({ status: true });
      }
      
    });
  } else {
    res.json({ status: false });
  }
});

//add to cart without logged_in

router.get("/add-item-cart/:id",(req, res)=>{

   if(req.session.user)
  {
    res.redirect(`/add-to-cart/${req.params.id}`)
  }else{
    let data={proId:req.params.id}
    req.session.noUserCart=data
   res.redirect('/login')
  }

})

//changeProductQauntity

router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  userHelpers.changeProductQauntity(req.body).then(async (response) => {
    let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);

    let totalPrice = 0;
    let subtotal = 0;

    for (var i in totalAmount) {
      totalPrice = totalPrice + totalAmount[i].subtotal;
    }
    for (var i in totalAmount) {
      subtotal = totalAmount[i].subtotal;
    }

    response.total = totalPrice;
    response.subtotal = subtotal;

    res.json(response);
  });
});

router.get("/cart/checkout", verifyLogin, async (req, res) => {
  var cartCount = await userHelpers.getCartCount(req.session.user._id);
  // let total = await userHelpers.getTottalAmount(req.session.user._id);
  let proId = req.query.id;
  let singleProductPrice;

  if (proId) {
    let buyNowproduct = await userHelpers.buyNow(proId);

    singleProductPrice = buyNowproduct.price;
    req.session.buyNow = buyNowproduct._id;
  }
  let user = req.session.user;
  let userId = req.session.user._id;

  let useraddres = await userHelpers.getUserAddress(req.session.user._id);
  let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
  // let subtotal = await userHelpers.getSubTotal(req.session.user._id)
  let totalPrice = 0;

  for (var i in totalAmount) {
    totalPrice = totalPrice + totalAmount[i].subtotal;
  }
  let buyproductPrice;
  if (proId) {
    buyproductPrice = singleProductPrice;
  } else {
    buyproductPrice = totalPrice;
  }

  res.render("user/checkout", {
    user: req.session.user,
    useraddres,
    totalAmount,
    buyproductPrice,
    cartCount,
  });
});

router.post("/remove-item", verifyLogin, async (req, res) => {
  let cartId = req.body.cartId;
  let item = req.body.proId;

  await userHelpers.deleteCartProduct(cartId, item).then((response) => {
    res.json({ response });
  });
});

router.post("/cart/checkout/addAddress", (req, res) => {
  let userId = req.session.user._id;
  let address = req.body;

  userHelpers.addAddress(userId, address).then((response) => {
    res.redirect("/cart/checkout");
  });
});
router.post("/delete-cart-product", (req, res) => {
  userId = req.session.user._id;
  userHelpers.deleteFinalCart(userId).then((response) => {
    res.json({ response: true });
  });
});

router.post("/place-order", async (req, res) => {
  let coupon = req.body.couponCode;
  let newPrice;
  //GET TOTTAL AMOUNT
  let response = await userHelpers.checkCoupon(coupon);
  //let couponId = response._id
  let product;
  let buyProducts;
  let buyNowOrder;
  let buyNow = req.session.buyNow;
  let productPrice;
  if (buyNow) {
    product = await userHelpers.buyNowProduct(buyNow);
    productPrice = product[0].price;
  } else {
    product = await userHelpers.getCartProductList(req.session.user._id);
  }

  if (response) {
    let minAmount = response.minAmount;

    let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
    let totalPrice = 0;

    for (var i in totalAmount) {
      totalPrice = totalPrice + totalAmount[i].subtotal;
    }

    if (totalPrice >= minAmount) {
      let discount = parseInt(response.discount);
      newPrice = Math.round(totalPrice - (totalPrice * discount) / 100);

      productHelpers.saveUserCoupon(req.session.user._id, response._id);
    } else {
      let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);

      let totalPrice = 0;

      for (var i in totalAmount) {
        totalPrice = totalPrice + totalAmount[i].subtotal;
      }
      newPrice = totalPrice;
    }
  } else {
    let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
    let totalPrice = 0;

    for (var i in totalAmount) {
      totalPrice = totalPrice + totalAmount[i].subtotal;
    }

    newPrice = totalPrice;
  }

  //let coupon=userHelpers.checkCoupon(req.body)
  //let totalAmount= await userHelpers.getTottalAmount(req.session.user._id)
  let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
  // let subtotal = await userHelpers.getSubTotal(req.session.user._id)

  let user = req.session.user;
  let userId = req.session.user._id;
  let totalPrice;
  if (buyNow) {
    totalPrice = productPrice;
  } else {
    totalPrice = newPrice;
  }

  userHelpers
    .PlaceOrder(user._id, req.body, product, totalPrice)
    .then((orderId) => {
      if (req.body["payment"] == "cod") {
        res.json({ codSuccess: true });
        //RAXORPAY
      } else if (req.body["payment"] == "razorpay") {
        userHelpers
          .generateRazorPay(orderId, totalPrice, userId)
          .then((response) => {
            res.json({ data: response, razorpaySuccess: true });
          });
      } else if (req.body["payment"] == "paypal") {
        const create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "http://localhost:3000/order-success",
            // "return_url": "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel",
          },
          transactions: [
            {
              item_list: {
                items: [
                  {
                    name: "Red Sox Hat",
                    sku: "001",
                    price: totalPrice,
                    currency: "USD",
                    quantity: 1,
                  },
                ],
              },
              amount: {
                currency: "USD",
                total: totalPrice,
              },
              description: "Hat for the best team ever",
            },
          ],
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.json(payment.links[i].href);
              }
            }
          }
        });
      }
      // res.redirect("/order-success")
    })
    .catch((err) => console.log(err));
});

router.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: "25.00",
        },
      },
    ],
  };

  userHelpers.deleteCartPaypal(req.session.user._id);

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));
        res.send("Success");
      }
    }
  );
});

router.get("/order-success", verifyLogin, (req, res) => {
  if (req.session.buyNow) {
    //delete session in buynow product
    delete req.session.buyNow;
  }
  res.render("user/order-success", { user: req.session.user });
});

router.get("/cancel", (req, res) => res.send("Cancelled"));

router.get("/orders", verifyLogin, async (req, res) => {
  var cartCount = await userHelpers.getCartCount(req.session.user._id);

  let category = await productHelpers.getCategory();

  let orders = await userHelpers.getUserOrders(req.session.user._id);
  //  let orderStatus=await userHelpers.getOrderStatus(req.session.user._id)
  //  console.log("orderstatus");
  //  console.log(orderStatus);
  res.render("user/odersList", {
    user: req.session.user,
    orders,
    cartCount,
    category,
  });
});
router.get("/view-order-product/:id", async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  var cartCount = await userHelpers.getCartCount(req.session.user._id);

  res.render("user/userorder", { user: req.session.user, products, cartCount });
});
router.post("/oders/cancelorder/:id", async (req, res) => {
  let orderId = req.params.id;
  await userHelpers.cancelOrder(orderId).then((response) => {
    res.json(response);
  });
});

router.post("/oders/deleteaddress", (req, res) => {
  uaddress = req.body.address;
  uname = req.body.name;
  addId = req.body.addressId;
  userId = req.session.user._id;

  userHelpers
    .deleteAdddress(uaddress, userId, addId, uname)
    .then((response) => {
      res.json({ response });
    });
});

router.post("/verify-payment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "" });
    });
});

router.post("/apply-coupon", async (req, res) => {
  let coupon = req.body.coupon;
  let userId = req.session.user._id;

  userHelpers.checkCoupon(coupon).then(async (response) => {
    if (response) {
      let totalAmount = await userHelpers.getTottalAmount(req.session.user._id);
      let totalPrice = 0;

      for (var i in totalAmount) {
        totalPrice = totalPrice + totalAmount[i].subtotal;
      }
      let minAmount = response.minAmount;
      if (totalPrice >= minAmount) {
        let discount = parseInt(response.discount);

        let newPrice = Math.round(totalPrice - (totalPrice * discount) / 100);

        res.json({ newPrice, couponMessage: true, message: "Coupon Applied" });
      } else {
        res.json({
          couponMessage1: true,
          Amessage: "Coupon   valid for this purshase above" + minAmount,
        });
      }

      // userHelpers.CheckUserCoupon(coupon,userId).then((response)=>{
      //   console.log("check user coupon");
      //   console.log(coupon);
      // })
    } else {
      res.json({ couponMessage2: true, Invalidmessage: "Coupon not  valid " });
    }
  });
});

router.get("/contact", async (req, res) => {
  var cartCount = await userHelpers.getCartCount(req.session.user._id);
  let category = await productHelpers.getCategory();
  let user = req.session.user;
  res.render("user/contact", { cartCount, user, category });
});
router.get("/profile", verifyLogin, async (req, res) => {
  let user = await userHelpers.getUserProfile(req.session.user._id);
  let useraddres = await userHelpers.getUserAddress(req.session.user._id);
  var cartCount = await userHelpers.getCartCount(req.session.user._id);
  res.render("user/userProfile", { user, useraddres, cartCount });
});
router.post("/pay", (req, res) => {});

router.post("/profile/user-details", (req, res) => {
  let name = req.body.username;
  let phone = req.body.phone;
  let email = req.body.email;
  let userId = req.session.user._id;
  userHelpers.updateUserInfo(name, phone, email, userId).then((response) => {
    res.json({ status: true });
  });
});

router.post("/change-password", (req, res) => {
  let oldPass = req.body.oldpassowrd;
  let userId = req.session.user._id;
  let newPass = req.body.newpassword;

  userHelpers.CheckPassword(oldPass, userId, newPass).then(() => {
    res.redirect("/profile");
  });
});
router.get("/category/:category", async (req, res) => {
  let categoryProduct = await productHelpers.getCategoryProduct(
    req.params.category
  );
  let user = req.session.user;
  var cartCount = await userHelpers.getCartCount(req.session.user._id);

  res.render("user/CategoryProduct", { categoryProduct, user, cartCount });
});

module.exports = router;

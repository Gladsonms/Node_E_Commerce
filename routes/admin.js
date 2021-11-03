const { response } = require("express");
var express = require("express");
const session = require("express-session");
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const { addCategory } = require("../helpers/product-helpers");
var router = express.Router();
const fs = require("fs");
const { resolve } = require("path");

const checkAuth = (req, res, next) => {
  if (req.session.isLoggedIn) {
    res.render("admin/home", { admin: true });
  } else {
    next();
  }
};

var adminUsername = "admin";
var adminPassword = "admin";

//login
router.get("/", checkAuth, function (req, res, next) {
  res.render("admin/adminlogin", { rejectHeader: true });
});
router.post("/adminLogin", function (req, res, next) {
  if (
    adminUsername == req.body.username &&
    adminPassword == req.body.password
  ) {
    req.session.username = adminUsername;
    req.session.password = adminPassword;
    req.session.isLoggedIn = true;
   
    res.redirect("/admin/home");
    
  } else {
   
    res.render("admin/adminlogin",{ err: "Invalid username or password" ,  rejectHeader: true });
  }
});

//home
router.get("/home",async function (req, res) {
 
  let userCount=await userHelpers.getUserCount();
  let productCount=await productHelpers.getProductCount();
  let orderCount=await productHelpers.getOrderCount();
  
 
  let lastOrderList=await productHelpers.getLastOrderList();
  let totalSalesAmount=await productHelpers.getTotalSalesAmount();
  
  
 
  
    
  res.render("admin/home", { admin: true ,userCount,orderCount,productCount,lastOrderList,totalSalesAmount});
});
router.post("/home",async(req,res)=>{
  let paymentMethod=await productHelpers.getPaymentMethod();
  let paymentMethodLabels = [...paymentMethod.map((value)=>(value._id))]
  let paymentMethodValues = [...paymentMethod.map((value)=>(value.count))]
  let oderStatus= await productHelpers.getOrderStatus();
  let orderStatusLabel=[...oderStatus.map((data)=>(data._id))]
  let orderStatusvalue=[...oderStatus.map((data)=>(data.count))]
  
  res.json({labels:paymentMethodLabels,values:paymentMethodValues,orderstatus:orderStatusLabel,ordervalue:orderStatusvalue})
})

//usermangment
router.get("/usermanagment", function (req, res) {
  userHelpers
    .getUserDetails()
    .then((users) => {
      res.render("admin/userManagment", { admin: true, users });
    })
    .catch((err) => {

    });
});

router.post("/usermanagment/disableuser", async (req, res) => {
  userHelpers.disableUser(req.body.id).then((response) => {
    res.redirect("/admin/usermanagment");
  });
});

router.post("/usermanagment/enableuser", async (req, res) => {
  userHelpers.enableUser(req.query.id, req.body).then(() => {  
    res.redirect("/admin/usermanagment");
  });
});

//product mangment
router.get("/productmanagment", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {

    res.render("admin/productsManagment", { admin: true, products });
  });
});

router.post("/productmangment/deleteproduct", function (req, res, next) {
  let productId = req.body.proId;
 
  

  productHelpers.deleteProduct(productId).then(async (response) => {
    //res.render("admin/productsManagment", { admin: true });
    //res.redirect("/admin/productmanagment");
    res.json(response)
  });
});
router.get("/productmangmnet/editproduct/:id", async (req, res) => {
  
  let products = await productHelpers.getProductDetails(req.params.id);
productHelpers.getCategory().then((category)=>{

  res.render("admin/editProduct", { admin: true, products,category });
})
});
router.post("/productmanagmnet/editproduct/:id", (req, res) => {
  let id = req.params.id;

  productHelpers.updateProducts(req.params.id, req.body).then((data) => {
   
    let id = "" + data;
    let image1 = req.body.image1_b64;
    let image2 = req.body.image2_b64;
    let image3 = req.body.image3_b64;
    let image4 = req.body.image4_b64;

   
    //  console.log(image1);
    //  console.log(image2);
    //  console.log(image3);
    //  console.log(image4);

    const path1 = `./public/product-images/product-image1/${id}.jpg`;
    const path2 = `./public/product-images/product-image2/${id}.jpg`;
    const path3 = `./public/product-images/product-image3/${id}.jpg`;
    const path4 = `./public/product-images/product-image4/${id}.jpg`;

    const base64Data1 = image1.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const base64Data2 = image2.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const base64Data3 = image3.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const base64Data4 = image4.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    


    fs.writeFileSync(path1, base64Data1, { encoding: "base64" });
    fs.writeFileSync(path2, base64Data2, { encoding: "base64" });
    fs.writeFileSync(path3, base64Data3, { encoding: "base64" });
    fs.writeFileSync(path4, base64Data4, { encoding: "base64" });
    res.redirect("/admin/productmanagment");

  });
});


router.get("/productmanagment/adddproduct", function (req, res) {
  productHelpers.getCategory().then((category) => {
    res.render("admin/addProducts", { admin: true, category });
  });
});
router.post("/productmanagmnet/addproduct", function (req, res) {
  productHelpers.addProduct(req.body).then((data) => {
    let id = "" + data;
    let image1 = req.body.image1_b64;
    let image2 = req.body.image2_b64;
    let image3 = req.body.image3_b64;
    let image4 = req.body.image4_b64;
      
    const path1 = `./public/product-images/product-image1/${id}.jpg`;
    const path2 = `./public/product-images/product-image2/${id}.jpg`;
    const path3 = `./public/product-images/product-image3/${id}.jpg`;
    const path4 = `./public/product-images/product-image4/${id}.jpg`;

    const base64Data1 = image1.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const base64Data2 = image2.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const base64Data3 = image3.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const base64Data4 = image4.replace(/^data:([A-Za-z-+/]+);base64,/, "");

    fs.writeFileSync(path1, base64Data1, { encoding: "base64" });
    fs.writeFileSync(path2, base64Data2, { encoding: "base64" });
    fs.writeFileSync(path3, base64Data3, { encoding: "base64" });
    fs.writeFileSync(path4, base64Data4, { encoding: "base64" });

    res.redirect("/admin/productmanagment");
  });
});

router.post("/getCategory", (req, res) => {

  productHelpers.sortCategory(req.body.Category).then((sorttedCategory) => {
   
    res.json({ sorttedCategory });
  });
});

//category mangmnet

router.get("/categorymangament", function (req, res) {
  productHelpers.getCategory().then((category) => {
    res.render("admin/categoryManagment", { admin: true, category });
  });
});
router.post('/categorymangament/delete-category/',function (req,res){
  
  let category=req.body.categoryId
  

  productHelpers.deleteCategory(category).then((response)=>{
    res.json(response)
  })
})

router.post("/categorymangament/addcategory", (req, res) => {
  productHelpers.addCategory(req.body).then((data) => {
    res.redirect('/admin/categorymangament')
  });
});

router.get("/subcategorymangament", async (req, res) => {
  await productHelpers.getCategory().then((category) => {

    res.render("admin/subcategoryManagment", { admin: true, category });
  });
});

router.post("/categorymangament/addsubCategory", (req, res) => {
  productHelpers
    .addsubCategory(req.body)
    .then(() => {
      res.redirect("/admin/subcategorymangament");
    })
    .catch((err) => {
      res.redirect("admin/subcategorymangament");
    });
});

router.post('/subcategorymangament/delete-category',(req,res)=>{
 
  ///catname=req.body.custId

  let name=req.body.subcat
  console.log(name);
  console.log(req.body);
  
 productHelpers.deleteSubCategory(name).then(async (response)=>{
   res.json(response)
})
  
})


//order Manngment
router.get("/ordermangment",async(req,res)=>{
  await productHelpers.getAllUserOrder().then((oders)=>{
    let newOrders = oders.map((order,index)=>{
      order.isCancelled=order.status === 'Cancel'
    order.isDeleviered=order.status === 'Deliverd';
    return order;

    })
    
    console.log(newOrders);
    console.log("newOrders");
    res.render('admin/ordermangment',{admin:true,newOrders})
    
  })
})
  router.post('/changeorderstatus/:id',(req,res)=>{
    
    let orderId=req.params.id
    let data = req.body
    
    
    var values= {orderId,data}
    userHelpers.testing(data,orderId).then((response)=>{

res.json({status:true})
      
    })

   
    

   
    //productHelpers.changeOrderStatus()
     
  })
   ///Offer mnagmaent
    router.get("/product-offer",async(req,res)=>{
      let product=productHelpers.getAllProducts().then((product)=>{
      let  offerProduct=productHelpers.getOfferProduct().then((offerProduct)=>{

        res.render('admin/productoffer',{admin:true,product,offerProduct})
             })
      })
    })
    router.post("/add-new-productoffer",(req,res)=>{
     
      let  product=req.body.productname
      console.log(req.body);
      productHelpers.addNewProductOffer(req.body,product).then((response)=>{
            res.json({response})
      })
      
    })
   


    router.get("/category-offer",(req,res)=>{
      let categoryOffer=productHelpers.getCategoryOffers()
      productHelpers.getCategory().then((category)=>{
        
        res.render('admin/categoryOffer',{admin:true,category,categoryOffer})
      })
  })

  router.get("/add-coupon",(req,res)=>{
     productHelpers.getAllCoupons().then((coupon)=>{
          
       res.render('admin/coupon-mange',{admin:true,coupon})
     })

      
   
    
  })

   router.post("/delete-product-offer",(req,res)=>{
    console.log(req.body);
    let productId=req.body.proId
    productHelpers.removeOffer(productId).then((response)=>{

            res.json({status:true})
      
    })
    
   })

   router.post("/add-category-offer",(req,res)=>{
     let category=req.body.categoryname
     let percetage=req.body.offerpercentage
     let offerexpdate=req.body.expdate
     
  
     productHelpers.addCategoryOffer(req.body).then((response)=>{
          res.json({response})
    })
    
   })
   router.post("/add-new-coupan",(req,res)=>{
     productHelpers.addCoupan(req.body).then((response)=>{
       res.json({response})
     })
   })
  router.post("/delete-coupon-admin",(req,res)=>{
    
    let couponid=req.body.id
    productHelpers.deleteCoupons(couponid).then((response)=>{
                res.json({status:true})
    })
  })

  //sales Report
  router.get("/salereport",async(req,res)=>{
   
    let oders=await productHelpers.getDeliveredReports()
    
    res.render('admin/salereport',{admin:true,oders})
  })



//logout
router.get("/logout", function (req, res) {
  req.session.isLoggedIn = false;
 
  res.redirect("/admin");
});


module.exports = router;

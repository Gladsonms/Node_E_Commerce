const { response } = require("express");
var express = require("express");
const session = require("express-session");
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const { addCategory } = require("../helpers/product-helpers");
var router = express.Router();
const fs = require("fs");

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
router.get("/home", function (req, res) {
  res.render("admin/home", { admin: true });
});

//usermangment
router.get("/usermanagment", function (req, res) {
  userHelpers
    .getUserDetails()
    .then((users) => {
      res.render("admin/userManagment", { admin: true, users });
    })
    .catch((err) => {
      console.log(err);
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
    console.log(products);
    res.render("admin/productsManagment", { admin: true, products });
  });
});

router.post("/productmangment/deleteproduct/:id", function (req, res, next) {
  
  let productId = req.params.id;
  

  productHelpers.deleteProduct(productId).then((response) => {
    //res.render("admin/productsManagment", { admin: true });
    res.redirect("/admin/productmanagment");
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
  console.log(id);
  productHelpers.updateProducts(req.params.id, req.body).then((data) => {
    let id = "" + data;
    let image1 = req.body.image1_b64;
    let image2 = req.body.image2_b64;
    let image3 = req.body.image3_b64;
    let image4 = req.body.image4_b64;
    //console.log(image1);  

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

    // let image1 = req.files.productimage1;
    // let image2 = req.files.productimage2;
    // let image3 = req.files.productimage3;
    // let image4 = req.files.productimage4;
    // console.log("start");
    // console.log(image1);
    // console.log(image2);
    // console.log(image3);
    // console.log(image4);
    // console.log("end");
    // image1.mv(
    //   "./public/product-images/product-image1/" + id + ".jpg",
    //   (err) => {
    //     if (!err) {
    //       res.render("admin/addProducts");
    //     } else {
    //       console.log(err);
    //     }
    //   }
    // );
    // image2.mv(
    //   "./public/product-images/product-image2/" + id + ".jpg",
    //   (err) => {
    //     if (!err) {
    //       res.render("admin/addProducts");
    //     } else {
    //       console.log(err);
    //     }
    //   }
    // );
    // image3.mv(
    //   "./public/product-images/product-image3/" + id + ".jpg",
    //   (err) => {
    //     if (!err) {
    //       res.render("admin/addProducts");
    //     } else {
    //       console.log(err);
    //     }
    //   }
    // );
    // image4.mv(
    //   "./public/product-images/product-image4/" + id + ".jpg",
    //   (err) => {
    //     if (!err) {
    //       res.render("admin/addProducts");
    //     } else {
    //       console.log(err);
    //     }
    //   }
    // );
    // //res.render('admin/addProducts', { admin: true })
  });
});
// router.post('/productmanagmnet/editproduct/:id',(req,res)=>{
//   console.log("asxvhxhas");
// })

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
    //console.log(image1);

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
router.post('/categorymangament/delete-category/:id',function (req,res){
  
  let categoryId=req.params.id
  //console.log(categoryId);
  productHelpers.deleteCategory(categoryId).then((response)=>{
      res.redirect('/categorymangament')
  })
})

router.post("/categorymangament/addcategory", (req, res) => {
  productHelpers.addCategory(req.body).then((data) => {});
});

router.get("/subcategorymangament", async (req, res) => {
  await productHelpers.getCategory().then((category) => {
    console.log(category)
    res.render("admin/subcategoryManagment", { admin: true, category });
  });
});

router.post("/categorymangament/addsubCategory", (req, res) => {
  productHelpers
    .addsubCategory(req.body)
    .then(() => {
      res.redirect("/subcategorymangament");
    })
    .catch((err) => {
      res.redirect("/subcategorymangament");
    });
});

router.post('/subcategorymangament/delete-category/:this',(req,res)=>{
 
  catname=req.body.custId

  let name=req.params.this
  
 productHelpers.deleteSubCategory(name,catname).then((response)=>{
   res.redirect('/admin/subcategorymangament')
 })
  
})


//order MaUngment
router.get("/ordermangment",async(req,res)=>{
  let oders=await productHelpers.getAllUserOrder().then((oders)=>{
    res.render('admin/ordermangment',{admin:true,oders})
    
  })
})
  router.post('/changeorderstatus/:id',(req,res)=>{
    
    let orderId=req.params.id
    let data = req.body
    
    var values= {orderId,data}
    userHelpers.testing(data,orderId).then(()=>{

      
    })

   
    

   
    //productHelpers.changeOrderStatus()
     
  })



//logout
router.get("/logout", function (req, res) {
  req.session.isLoggedIn = false;
  req.session.destroy();
  res.redirect("/admin");
});


module.exports = router;

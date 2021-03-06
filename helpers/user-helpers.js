var db = require("../config/connection");
var collection = require("../config/collections");
const bcyrpt = require("bcrypt");
var ObjectId = require("mongodb").ObjectId;
 
const {
  USER_COLLECTIONS,
  CATEGORYOFFER_COLLECTIONS,
} = require("../config/collections");
const moment = require("moment");
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { profileEnd } = require("console");
const { log } = require("debug");
//const { ObjectID, ObjectId } = require('bson')
var instance = new Razorpay({
  key_id: "rzp_test_wof2EdLxFrX857",
  key_secret: "x8JE5ePxnOtxamNo5nXkXgJE",
});
module.exports = {
  doSignup: (userData) => {
    {
      userData;
    }
    return new Promise(async (resolve, reject) => {
      userData.status = true;
      userData.password = await bcyrpt.hash(userData.password, 10);
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .insertOne(userData)
        .then((data) => {
          resolve(data);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ email: userData.email });

      let usersStatus = user ? (user.status ? true : false) : false;

      if (user && usersStatus) {
        bcyrpt
          .compare(userData.password, user.password)
          .then((status) => {
            if (status) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              let response = { status: false };
              resolve(response);
            }
          })
          .catch(() => {});
      } else {
        let response = { status: false };
        resolve(response);
      }
    });
  },
  getUserDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .find()
        .toArray();
      resolve(users);
    });
  },
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ email: email })
        .then((response) => {
          resolve(response);
        });
    });
  },
  //add google account user to collection
  addGoogleUser: (email, username) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .insertOne({ email, username, status: true });
    }).then((response) => {
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ _id: response.insertedId })
        .then((response) => resolve(response));
    });
  },

  //disableUser
  disableUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne({ _id: ObjectId(userId) }, [{ $set: { status: false } }])
        .then((response) => {
          resolve(response);
        });
    });
  },
  //enable user by admin
  enableUser: (userId) => {

    return new Promise((resolve, rejcet) => {
      
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne({ _id: ObjectId(userId) }, [{ $set: { status: true } }])
        .then((response) => {
          resolve(response);
        });
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };

    return new Promise(async (resolve, rejcet) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .findOne({ user: ObjectId(userId) });

      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );

        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .updateOne(
              { user: ObjectId(userId), "products.item": ObjectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve({ statusCount: true });
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .updateOne(
              { user: ObjectId(userId) },
              { $push: { products: proObj } }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTIONS)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      resolve(cartItems);

      
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .findOne({ user: ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQauntity: (details) => {
    let count = parseInt(details.count);
    let quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTIONS)
          .updateOne(
            { _id: ObjectId(details.cart) },
            { $pull: { products: { item: ObjectId(details.product) } } }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTIONS)
          .updateOne(
            {
              _id: ObjectId(details.cart),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": count },
            }
          )
          .then((response) => {
          
            resolve({ status: true });
          });
          
          
      }
    });
  },
  getTottalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          // {
          //   $group: {
          //     _id: null,
          //     total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
          //   },
          // },
          // variable = result.map((i)=>i.product.offerprice?{...i,subtotal:(i.product.offrprice*i.quantity)}:{..i,subtotal:(i.product.price*i.qauntity)})
        ])
        .toArray()
        .then((result) => {
          let actualPrice = result.map((i) =>
            i.product.productOffer
              ? { ...i, subtotal: i.product.productOffer * i.quantity }
              : { ...i, subtotal: i.product.price * i.quantity }
          );

          resolve(actualPrice);
        });
    });
  },
  getSubTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let subtotal = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              //_id:null,
              subtotal: {
                $sum: { $multiply: ["$quantity", "$product.price"] },
              },
            },
          },
        ])
        .toArray();

      resolve(subtotal);
    });
  },

  deleteCartProduct: (cartId, item) => {
    return new Promise(async (resolve, rejcet) => {
      await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .updateOne(
          { _id: ObjectId(cartId) },
          { $pull: { products: { item: ObjectId(item) } } }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  //order Mangment

  //add Addresss

  addAddress: (userId, address) => {
    return new Promise(async (resolve, rejcet) => {
      let addressObj = {
        name: address.name,
        phone: address.phone,
        place: address.place,
        address: address.address,
        city: address.city,
        pincode: address.pincode,
        id: "" + Math.random(),
      };

      let userAddresssObj = {
        user: ObjectId(userId),
        address: [addressObj],
      };

      let userAddress = await db
        .get()
        .collection(collection.ADDRESS_COLLECTIONS)
        .findOne({ user: ObjectId(userId) });

      if (userAddress) {
        db.get()
          .collection(collection.ADDRESS_COLLECTIONS)
          .updateOne(
            { user: ObjectId(userId) },
            { $push: { address: addressObj } }
          )
          .then((response) => {
            resolve(response);
          });
      } else {
        db.get()
          .collection(collection.ADDRESS_COLLECTIONS)
          .insertOne(userAddresssObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  checkNumber: (number) => {
    
    return new Promise(async (resolve, reject) => {
      let userNumber = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ phone: number })
        .then((response) => {
      
          resolve(response);
        });
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .findOne({ user: ObjectId(userId) });

      resolve(cart.products);
    });
  },
  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTIONS)
        .findOne({ user: ObjectId(userId) });

      resolve(address);
    });
  },

  PlaceOrder: (user, order, products, total) => {
    return new Promise(async (resolve, reject) => {
      let status;
      if (order.payment=='cod'){
         status='placed'
      }else if(order.payment=='paypal'){
         status='placed'
      }else{
         status='pending'
      }
      let orderObj = {
        userId: order.userId[0],
        address: order.address,
        paymentMethod: order.payment,
        products: products,
        total: total,
        status: status,
        date: moment().format("dddd, MMMM Do YYYY, h:mm:ss a"),
        createdAt: new Date(),
      };
       
      let userId = order.userId[0];

      db.get()
        .collection(collection.ORDER_COLLECTIONS)
        .insertOne(orderObj)
        .then((response) => {
          resolve(response.insertedId);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  deleteCartItem:(userId)=>{
    return new Promise((resolve,reject)=>{
   
        db.get()
          .collection(collection.CART_COLLECTIONS)
          .deleteOne({ user: ObjectId(userId) });
      
    })
  },

  

  
  // deleteFinalCart: (user) => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collection.CART_COLLECTIONS)
  //       .deleteOne({ user: ObjectId(user) })
  //       .then((response) => {
  //         resolve();
  //       });
  //   });
  // },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let oders = await db
        .get()
        .collection(collection.ORDER_COLLECTIONS)
        .find({ userId: userId }).sort({"createdAt":-1})
        .toArray();

      resolve(oders);
    });
  },
  getOrderProducts: (productId) => {
    return new Promise(async (resolve, reject) => {
      let oderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTIONS)
        .aggregate([
          {
            $match: { _id: ObjectId(productId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();

      resolve(oderItems);
    });
  },
  testing: (data, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTIONS)
        .updateOne(
          { _id: ObjectId(orderId) },
          { $set: { status: data.status } }
        )
        .then((result) => {
          resolve({ status: true });
        })
        .catch((err) => {});
    });
  },
  cancelOrder: (oderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTIONS)
        .updateOne(
          { _id: ObjectId(oderId) },
          { $set: { status: "Cancel", userCancel: true, adminCancel: false } }
        ).then((res) => {
          
          resolve(res);
        });
    })
  },
  deleteAdddress: (uaddress, userId, addId, uname) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTIONS)
        .updateOne(
          { user: ObjectId(userId) },
          { $pull: { address: { id: uaddress } } }
        )
        .then((response) => {
          resolve(true);
        });
    });
  },

  generateRazorPay: (orderId, totalAmount, userId) => {
    
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalAmount * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
        } else {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .deleteOne({ user: ObjectId(userId) });

          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, rejcet) => {
     
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "x8JE5ePxnOtxamNo5nXkXgJE");
      
      hmac.update(
        details["payment[razorpay_order_id]"] +  "|" +  details["payment[razorpay_payment_id]"]
      )
     
      hmac = hmac.digest("hex");
      
      if (hmac == details["payment[razorpay_signature]"]) {
        
        resolve();
      } else {
       
        rejcet();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTIONS).updateOne(
        { _id: ObjectId(orderId) },
        {
          $set: { status: "placed" },
        }
      ).then((result) => {
       
        resolve(result);
      });
    })
  },
  getuserProfile: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ _id: ObjectId(userId) })
        .toArray();
    }).then((response) => {});
  },

  getUserCount: () => {
    return new Promise(async (resolve, reject) => {
      let userCount = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .find({})
        .count();

      resolve(userCount);
    });
  },
  updateUserInfo: (name, phone, email, userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne(
          { _id: ObjectId(userId) },
          { $set: { username: name, email: email, phone: phone } }
        );

      resolve(user);
    });
  },
  getUserProfile: (userId) => {
    return new Promise(async (resolve, reject) => {
      let profile = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ _id: ObjectId(userId) });

      resolve(profile);
    });
  },
  CheckPassword: (oldpass, userId, newPass) => {
    return new Promise(async (resolve, rejcet) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ _id: ObjectId(userId) });
      bcyrpt.compare(oldpass, user.password).then(async (status) => {
        if (status) {
          newPass = await bcyrpt.hash(newPass, 10);

          
          db.get()
            .collection(collection.USER_COLLECTIONS)
            .updateOne(
              { _id: ObjectId(userId) },
              { $set: { password: newPass } }
            )
            .then((response) => {
              resolve(response);
            });
        } else {
        }
      });
    });
  },
  deleteCartPaypal: (user) => {
    console.log("--------------------");
    return new Promise(async (resolve,reject)=>{
      db.get()
      .collection(collection.CART_COLLECTIONS)
      .deleteOne({ user: ObjectId(user) })
      .then((response) => {
        console.log(response);
        resolve(response);
      });
    })
  
  },
  addUsersCoupon: (caupon, userId) => {
    return new Promise(async (resolve, reject) => {
      let coupan = await db
        .get()
        .collection(collection.COUPAN_COLLECTIONS)
        .find()
        .toArray();
      for (var i in coupan) {
        if (caupon == coupan[i].couupanCode) {
          db.get()
            .collection(collection.USER_COLLECTIONS)
            .updateOne(
              { _id: ObjectId(userId) },
              { $push: { appliedCoupons: caupon } }
            )
            .then((response) => {
              resolve();
            });
        } else {
        }
      }
    });
  },
  checkCoupon: (coupon) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPAN_COLLECTIONS)
        .findOne({ couupanCode: coupon })
        .then((response) => {
          resolve(response);
        });
    });
  },
  CheckUserCoupon: (coupan, userId, couponId) => {
    return new Promise(async (resolve, reject) => {
      let user = db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ _id: ObjectId(userId) });
      if (user.appliedCoupons) {
        let couponExist = user.appliedCoupons.find((coupon) =>
          coupan.coupanId.equals(couponId)
        );
        resolve(couponExist ? true : false);
      } else {
        resolve(false);
      }
    });
  },
  getOrderStatus: (orderId) => {
   return new Promise((resolve, reject) => {

     db.get()
       .collection(collection.ORDER_COLLECTIONS)
       .findOne({ _id: ObjectId(orderId) })
       .then((data) => {
         if(data.status='pending')
         {
           resolve(data)
         }
         //resolve(data);
         
       });
   })
  },
  //buynow
  buyNow: (proId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .findOne({ _id: ObjectId(proId) })
        .then((data) => {
          resolve(data);
        });
    });
  },
  //get buy now product
  buyNowProduct: (buyNowProduct) => {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .find({ _id: ObjectId(buyNowProduct) })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
};

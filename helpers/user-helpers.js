var db = require("../config/connection");
var collection = require("../config/collections");
const bcyrpt = require("bcrypt");
var ObjectId = require("mongodb").ObjectId;
const { response } = require("express");
const { get } = require("../routes/admin");
const { USER_COLLECTIONS } = require("../config/collections");
const moment = require("moment");
const  Razorpay=require('razorpay');
const { resolve } = require("path");
//const { ObjectID, ObjectId } = require('bson')
var instance = new Razorpay({
  key_id: 'rzp_test_wof2EdLxFrX857',
  key_secret: 'x8JE5ePxnOtxamNo5nXkXgJE',
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
          .catch(() => {
            console.log("error");
          });
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
  enableUser: (userId) => {
    return new Promise((resolve, rejcet) => {
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne({ _id: ObjectId(userId) }, [{ $set: { status: true } }])
        .then((response) => {
          resolve();
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
      console.log(userCart);

      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);
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
              resolve();
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
      console.log(cartItems);
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
      //console.log(count);
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
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();
      resolve(total[0].total);
      // console.log(total[0].total);
      if (total[0].total == 0) {
        resolve(total[0].total);
      } else {
        resolve();
      }
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
          console.log("resolved response");
          console.log(response);

          resolve(response);
        });
    });
  },

  //order Mangment

  //add Addresss

  addAddress: (userId, address) => {
    ;
    return new Promise(async (resolve, rejcet) => {
      
      let addressObj = {
        name: address.name,
        phone: address.phone,
        place: address.place,
        address: address.address,
        city: address.city,
        pincode: address.pincode,
        id: ""+Math.random(),
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
            //console.log(response);
          });
      } else {
        db.get()
          .collection(collection.ADDRESS_COLLECTIONS)
          .insertOne(userAddresssObj)
          .then((response) => {
            //console.log(response);
          });
      }
    });
  },
  checkNumber: (number) => {
    console.log(number);
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
           
      resolve(cart.product);
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

  // getUserSingleAddres:(username)=>{
  //    return new Promise(async(resolve,reject)=>{
  //      let address=await db.get().collection(collection.ADDRESS_COLLECTIONS).findOne({"adress.name":username})
  //      console.log("single user address");
  //         console.log(address);
  //         resolve(address)
  //     })
  // },

  PlaceOrder: (order, products, total) => {
    return new Promise(async (resolve, reject) => {
      let status = order.payment == "cod" ? "placed" : "pending";
      let orderObj = {
        userId: order.userId,
        address: order.address,
        paymentMethod: order.payment,
        products: products,
        total: total,
        status: status,
        date: moment().format("dddd, MMMM Do YYYY, h:mm:ss a"),
      };
      let userId = order.userId;

      let orderDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTIONS)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .deleteOne({ user: ObjectId(userId) });
          resolve(response.insertedId);
          console.log(response.insertedId);
        });
    });
  },
  getUserOrders: (userId) => {
    console.log(userId);
    return new Promise(async (resolve, reject) => {
      let oders = await db
        .get()
        .collection(collection.ORDER_COLLECTIONS)
        .find({ userId: userId })
        .toArray();

      console.log(oders);
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

  //   changeOrderStatus:(value)=>{
  //     return new Promise((resolve,reject)=>{
  //         console.log("Change oders status");
  //         console.log(value)
  //         console.log(Id);
  //         db.get().collection(collection.ORDER_COLLECTIONS).updateOne({_id:ObjectId(Id)},{$set:{status:status.status}}).then((result)=>{
  //             console.log(result)
  //         }).catch((err)=>{
  //             console.log(err)
  //         })
  //     })
  // },

  testing: (data, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTIONS)
        .updateOne(
          { _id: ObjectId(orderId) },
          { $set: { status: data.status } }
        )
        .then((result) => {
          console.log(result);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },
  cancelOrder: (oderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTIONS)
        .updateOne({ _id: ObjectId(oderId) }, { $set: { status: "Cancel" } });
    });
  },
  deleteAdddress: async(uaddress, userId, addId, uname) => {
    console.log(uaddress);
    console.log(userId);
    console.log(addId);
let address = await db.get().collection(collection.ADDRESS_COLLECTIONS).findOne({"address.id":uaddress});
console.log(address);
    db.get()
      .collection(collection.ADDRESS_COLLECTIONS)
      .update(
        { user: ObjectId(userId) },
        { $pull: { address: { id: uaddress } } },
        
      )
      .then((res) => {
        console.log(res);
        console.log("finished");
      });
  },
  generateRazorPay:(orderId,totalAmount)=>{
    console.log(orderId);
    return new Promise((resolve,reject)=>{
      var options = {  
        amount: totalAmount*100,  // amount in the smallest currency unit  
        currency: "INR", 
         receipt: ""+orderId
        };
        instance.orders.create(options, function(err, order) {
          if(err)
          {
            console.log(err);
          } 
          else 
          {
            console.log("new order");
            console.log(order);
           resolve(order)  
          }
          
          });    

    })
  },
verifyPayment:(details)=>{
return new Promise((resolve,rejcet)=>{
  const crypto = require('crypto');
  let hmca = createHmac('sha256', x8JE5ePxnOtxamNo5nXkXgJE)
  hmca.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
  hmca=hmca.digest('hex')
  if(hmca==details['payment[razorpay_signature]']){
    resolve()
  }else{
    rejcet()
  }

})
},
changePaymentStatus:(orderId)=>{
return new Promise((resolve,reject)=>{
  db.get.collection(collection.ORDER_COLLECTIONS).updateOne({_id:ObjectId(orderId)},{
    $set:{ status :'placed'}
  }
  )
}).then(()=>
{
  resolve()
})
}

};

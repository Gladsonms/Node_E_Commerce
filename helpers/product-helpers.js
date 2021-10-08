var db=require('../config/connection')
var collection=require("../config/collections")
var ObjectId = require("mongodb").ObjectId;
const { ObjectID } = require('bson');
module.exports = {
    addProduct:(product,callback)=>{
        return new Promise(async(resolve,reject)=>{

            let id= await  db.get().collection(collection.PRODUCT_COLLECTIONS).insertOne(product)
                   
             resolve(id.insertedId)
            
        })
         
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            
            let product= await db.get().collection(collection.PRODUCT_COLLECTIONS).find({}).toArray()
                resolve(product)
        })
    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            console.log("delete product");
            console.log(productId);
            db.get().collection(collection.PRODUCT_COLLECTIONS).deleteOne({ _id: ObjectId(productId) }).then((response)=>{
                resolve(response)
                console.log(response);
            }).catch((err)=>{
          console.log(err);
            })
        })
    }
}
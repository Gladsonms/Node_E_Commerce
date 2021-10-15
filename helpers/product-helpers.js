var db = require('../config/connection')
var collection = require("../config/collections")
var ObjectId = require("mongodb").ObjectId;
const { ObjectID } = require('bson');
const { response } = require('express');
const { Forbidden } = require('http-errors');
module.exports = {
    addProduct: (productDetails, callback) => {
        productDetails = {
            product:productDetails.product,
            description:productDetails.description,
            category:productDetails.category,
            subCategory:productDetails.subCategory,
            price:parseInt(productDetails.price),
            quantity:parseInt(productDetails.quantity)

        }
        return new Promise(async (resolve, reject) => {

            let id = await db.get().collection(collection.PRODUCT_COLLECTIONS).insertOne(productDetails)

            resolve(id.insertedId)

        })

    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {

            let product = await db.get().collection(collection.PRODUCT_COLLECTIONS).find({}).toArray()
            resolve(product)
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            console.log("delete product");
            console.log(productId);
            db.get().collection(collection.PRODUCT_COLLECTIONS).deleteOne({ _id: ObjectId(productId) }).then((response) => {
                resolve(response)
                console.log(response);
            }).catch((err) => {
                console.log(err);
            })
        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTIONS).findOne({ _id: ObjectId(productId) }).then((products) => {

                resolve(products)
            })
        })
    },
    updateProducts: (productId, productDetails) => {

        return new Promise(async (resolve, reject) => {


            await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: ObjectId(productId) }, { $set: { product: productDetails.product, category: productDetails.category, subCategory: productDetails.subCategory, price: productDetails.price, quantity: productDetails.quantity, description: productDetails.description } }).then((response) => {
                resolve()

            })
            console.log(response);
        })

    },


    ///category
    addCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            let id = await db.get().collection(collection.CATEGORY_COLLECTIONS).insertOne(category)
            resolve(id.insertedId)
        })
    },
    getCategory: () => {

        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTIONS).find({}).toArray()
            resolve(category)
        })

    },
    sortCategory : (data) =>{
        
        return new Promise(async (resolve,reject)=>{
   let sorttedCategory = await db.get().collection(collection.CATEGORY_COLLECTIONS).findOne({category:data},{subCategory:1})
   //console.log("sorrtedCategory");
   //console.log(sorttedCategory);
   resolve(sorttedCategory)
        })
    },
    addsubCategory: (data) => {
        return new Promise(async (resolve, reject) => {
           
           
            let category = data.category
            let subcategory=data.subcategory
           // console.log(category, subcategory,"thi si cheki")
            // let checkSubCategory = await db.get().collection(collection.CATEGORY_COLLECTIONS).find({category:data.category}).toArray()

           let checkSubCategory = await db.get().collection(collection.CATEGORY_COLLECTIONS).findOne({subcategory:{$in:[data.subcategory]}})
          // console.log(checkSubCategory,"---------------------")
           if(checkSubCategory){
               reject("already exist")
           }else{
           await db.get().collection(collection.CATEGORY_COLLECTIONS).updateOne({category:data.category},{$push:{subcategory:data.subcategory}})
           resolve(true)
           }
           
           
           
           
           
           




        })

    },
    deleteCategory:(categoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTIONS).deleteOne({_id:ObjectId(categoryId)}).then((response)=>{
              resolve(response)
            }).catch((err)=>{
                console.log(err);
            })
        })


    },
}
var db = require('../config/connection')
var collection = require("../config/collections")
var ObjectId = require("mongodb").ObjectId;
const { ObjectID } = require('bson');
const { response } = require('express');
const { Forbidden } = require('http-errors');
const { Db } = require('mongodb');
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

            db.get().collection(collection.PRODUCT_COLLECTIONS).deleteOne({ _id: ObjectId(productId) }).then((response) => {
                resolve(response)

            }).catch((err) => {

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

   resolve(sorttedCategory)
        })
    },
    addsubCategory: (data) => {
        return new Promise(async (resolve, reject) => {
           
           
            let category = data.category
            let subcategory=data.subcategory


           let checkSubCategory = await db.get().collection(collection.CATEGORY_COLLECTIONS).findOne({subcategory:{$in:[data.subcategory]}})

           if(checkSubCategory){
               reject("already exist")
           }else{
            
           await db.get().collection(collection.CATEGORY_COLLECTIONS).updateOne({category:data.category},{$push:{subcategory:data.subcategory}}).then((response)=>{

               resolve(true)
              
           })
           }
           
           
           
           
           
           




        })

    },
    deleteCategory:(categoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTIONS).deleteOne({_id:ObjectId(categoryId)}).then((response)=>{
              resolve(response)
            }).catch((err)=>{
               
            })
        })


    },
    
    
    deleteSubCategory:(name)=>{
        return new Promise((resolve,reject)=>{
        
            db.get().collection(collection.CATEGORY_COLLECTIONS).updateOne({subcategory
                :name},{$pull:{subcategory
                    :name}}).then((response)=>{
                resolve(response)
                
            }).catch((err)=>{
               
            })
        })
    },
    getAllUserOrder:()=>{
           return new Promise((resolve,reject)=>{
             let userOders=  db.get().collection(collection.ORDER_COLLECTIONS).find({}).toArray()
                   resolve(userOders)
           })
    },
    changeOrderStatus:()=>{
        return new Promise((resolve,reject)=>{
            
            db.get().collection(collection.ORDER_COLLECTIONS).updateOne({_id:ObjectId(Id)},{$set:{status:status.status}}).then((result)=>{
            
            }).catch((err)=>{
            
            })
        })
    },
    getProductCount:()=>{
        return new Promise((resolve,reject)=>{
           let productCount= db.get().collection(collection.PRODUCT_COLLECTIONS).find({}).count()
            resolve(productCount)
        })
    },
    getOrderCount:()=>{
        return new Promise((resolve,reject)=>{
            let orderCount=db.get().collection(collection.ORDER_COLLECTIONS).find({}).count()
            resolve(orderCount)
        })
    },
    
    addNewProductOffer:(offerData,product)=>{
        let productname=offerData.productname
        let offerPercent=parseInt(offerData.offerpercentage)
        let expdate=offerData.expdate
      ///  let offername=offerData.offername
    
        return new Promise(async(resolve,reject)=>{

            let product=await db.get().collection(collection.PRODUCT_COLLECTIONS).findOne({product:productname})
            
            let offerPrice=(product.price-(product.price*offerPercent/100))
            Math.round(offerPrice)
            console.log(offerPrice);
          
            db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({_id:product._id},{$set:{offerPrice:offerPrice,expiryDate:expdate}}).then((response)=>{
                resolve(response)
            })
        })
    
       // console.log(actualPrice);
        
       


    },
    getOfferProduct:()=>{
       return new Promise((resolve,reject)=>{
         db.get().collection(collection.PRODUCT_COLLECTIONS).find({offerPrice:{$exists:true}}).toArray().then((response)=>{

            resolve(response)
        })
           
        })
       
       
        

    },
    removeOffer:(productId)=>{
        return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({_id:ObjectId(productId)},{$unset:{offerPrice:"",expiryDate:""}}).then((response)=>{
            console.log(response);
                 resolve()
        })
        })
    }

}
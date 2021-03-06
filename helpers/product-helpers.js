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
             let userOders=  db.get().collection(collection.ORDER_COLLECTIONS).find({}).sort({"createdAt":-1}).toArray()
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
      
    
        return new Promise(async(resolve,reject)=>{

            let product=await db.get().collection(collection.PRODUCT_COLLECTIONS).findOne({product:productname})
            
            let offerPrice=Math.round(product.price-(product.price*offerPercent/100))
            
          
            db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({_id:product._id},{$set:{productOffer:offerPrice,expiryDate:expdate}}).then((response)=>{
                resolve(response)
            })
        })
    
       
        
       


    },
    getOfferProduct:()=>{
       return new Promise(async(resolve,reject)=>{
         db.get().collection(collection.PRODUCT_COLLECTIONS).find({productOffer:{$exists:true}}).toArray().then((response)=>{
            resolve(response)
        })
           
        })
       
       
        

    },
    //product offer
    removeOffer:(productId)=>{
        return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({_id:ObjectId(productId)},{$unset:{productOffer:"",expiryDate:""}}).then((response)=>{
           
                 resolve()
        })
        })
    },
    getCategoryOffers:()=>{
      return new Promise((resolve,reject)=>{
         db.get().collection(collection.PRODUCT_COLLECTIONS).find({categoryExpDate:{$exists:true}}).toArray().then((response)=>{
              resolve(response)
          })
      }) 
    },
    getTheCategoryOffer:()=>{
        return new Promise(async(resolve,reject)=>{
        await  db.get().collection(collection.CATEGORYOFFER_COLLECTIONS).find({}).toArray().then((response)=>{
            
            resolve(response)
            })

        })
    },
    //category offer adding
    addCategoryOffer:(data)=>{
        
        let categoryname=data.categoryname
        let offerpercentage=data.offerpercentage
        let catExpdate=data.expdate
        let categoryOffer=Math.round()
         
        return new Promise(async(resolve,reject)=>{
      
            
          db.get().collection(collection.CATEGORYOFFER_COLLECTIONS).insertOne({category:categoryname,discount:offerpercentage,expdate:catExpdate})
            let category=await db.get().collection(collection.PRODUCT_COLLECTIONS).find({category:categoryname}).toArray()
            
            for(var i in category){
                if(category[i].productOffer){
                    
                }
                else{
                    let price=category[i].price
                    let productId=category[i]._id
                   
                    let categoryOffer=Math.round(category[i].price-(category[i].price*offerpercentage/100))
                   
                    db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({_id:ObjectId(productId)},{$set:{productOffer:categoryOffer,expiryDate:catExpdate}}).then((response)=>{
                   
                    resolve(response)
                    })
                }
            }

          
        })
     
      
    },
    addCoupan:(data)=>{
        
        return new Promise((resolve,reject)=>{
            
            
            db.get().collection(collection.COUPAN_COLLECTIONS).insertOne({couupanCode:data.coupancode,discount:data.discount,maxAmount:data.maxAmount,minAmount:data.minAmount,expireAt:data.expdate}).then((response)=>{
             
                resolve()
            })
        })

    },
    getAllCoupons:async()=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.COUPAN_COLLECTIONS).find({}).toArray().then((coupon)=>{
            
            resolve(coupon)
           })
          
        })
    },
    deleteCoupons:(couponId)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPAN_COLLECTIONS).deleteOne({_id:ObjectId(couponId)}).then((response)=>{
                
               resolve(response)
            })
        })
    },
    saveUserCoupon:(userId,couponId)=>{
       
        return new Promise(async(resolve, reject)=>{
            let user=db.get().collection(collection.USER_COLLECTIONS).findOne({_id: ObjectId(userId)});
            if(user.coupons){
                await db.get().collection(collection.USER_COLLECTIONS).updateOne({_id: ObjectId(userId)},{$push:{coupons:{cid:couponId}}}).then((response)=>{
                   resolve()
                })
            }else{
                await db.get().collection(collection.USER_COLLECTIONS).updateOne({_id: ObjectId(userId)},{$set:{coupons:[{cid:couponId}]}}).then(()=>{
                    resolve()
                })
            }
            //db,get().collection(collection.USER_COLLECTIONS).updateOne({_id: ObjectId(userId)},$push{})
        })
    },
    getOrderStatus:()=>{
        return new Promise(async(resolve,reject)=>{
      const data = await db.get().collection(collection.ORDER_COLLECTIONS).aggregate([
          {
          
              $group:{_id :'$status', count: {$sum: 1}}
          
      },

    ]).toArray()
   
    resolve(data)
    },



    
 


        )},

 getPaymentMethod:()=>{
     return new Promise(async(resolve,reject)=>{
         const data = await db.get().collection(collection.ORDER_COLLECTIONS).aggregate([
             {
                 $group:{_id:"$paymentMethod",count:{$sum:1}}
             }
         ]).toArray()
         
         resolve(data)
     })
 },
 getLastOrderList:()=>{
     return new Promise(async(resolve,reject)=>{
         const data = await db.get().collection(collection.ORDER_COLLECTIONS).find().sort({"date":-1}).limit(7).toArray().then((data)=>{
         
             resolve(data)
         })
     })
 },
 getDeliveredReports:()=>{
    return new Promise(async(resolve,reject)=>{

        const data = await db.get().collection(collection.ORDER_COLLECTIONS).find({status:"placed"}).toArray().then((data)=>{
          
          resolve(data)
          
        })

    })
 },
 getTotalSalesAmount:()=>{
     return new Promise(async(resolve,reject)=>{
         const sales = await db.get().collection(collection.ORDER_COLLECTIONS).aggregate([
             {
              $match:{
                  status:{$ne :"Cancel"}
              }
             },
             { 
                 $group: {
                     _id: null,
                     revenue:{
                         $sum:'$total'
                     }
                 }
             },
             {
                 $project: {
                     _id:0,
                     revenue:1
                 }
             }
         ]).toArray();
         
         resolve(sales[0]);
         
     })
 },
 getCategoryProduct:(category)=>{
     
     return new Promise(async(resolve, reject)=>{
         
         db.get().collection(collection.PRODUCT_COLLECTIONS).find({category:category}).toArray().then((response)=>{
            
             resolve(response);
         })

     })
 },
 gettopSellingProducts:()=>{
     return new Promise(async(resolve,reject)=>{
       let topSellingProducts=await  db.get().collection(collection.ORDER_COLLECTIONS).aggregate([
             {
                 $match:{status:{$ne:"Cancel"}}
             },
             {
                 $unwind: "$products"
             },
             {
                 $group:{
                    _id:"$products.item",
                    count:{$sum:"$products.quantity"}
                 }

             },
             {
                 $sort:{count:-1}
             },
             {
                 $limit:10
             },
             {
                 $lookup:{
                     from:"PRODUCT",
                     pipeline:[
                        {
                            $project:{
                                product:1,category:1,price:1,quantity:1
                            }
                        }
                     ],
                     localField: "_id",
                     foreignField:"_id",
                     as:"product"
                 },
             },
             {
                 $unwind:'$product'
             }

         ]).toArray()
         
         resolve(topSellingProducts)
     })


 },
 getOrderDates:(start, end) => {
     return new Promise(async(resolve, reject) => {
       let odersDateWise= await  db.get().collection(collection.ORDER_COLLECTIONS).aggregate([
        {
            $match:{
                createdAt:{$gte:new Date(start),$lte:new Date(end)}
               }

        },
    

    ]).toArray()
   
    resolve(odersDateWise)
     })
 },
 getSorrtedReport:(type)=>{
     
    const numberOfDays = type ===  'daily'? 1 : type === 'weekly' ? 7 : type === 'monthly' ? 30 : type === 'yearly' ? 365 : 0
    const dayOfYear = (date) =>
        Math.floor(
            (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
        )
    return new Promise(async (resolve, reject) => {
        const data = await db.get().collection(collection.ORDER_COLLECTIONS).aggregate([
            {
                $match: {
                    //$and: [{ status: { $eq: 'placed' } }],
                    createdAt: { $gte: new Date(new Date() - numberOfDays * 60 * 60 * 24 * 1000) },
                },
            },


        ]).toArray()
        
        resolve(data)

    })
 },
 getSalesDate: () => {
    const dayOfYear = (date) =>
    Math.floor(
        (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    )
return new Promise(async (resolve, reject) => {
    const data = await db.get().collection(collection.ORDER_COLLECTIONS).aggregate([
        {
            $match: {
                status: { $ne: 'Cancel' } ,
                createdAt: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
            },
        },

        { $group: { _id: { $dayOfYear: '$createdAt' }, count: { $sum: 1 } } },
    ]).toArray()
    const thisday = dayOfYear(new Date())
    let salesOfLastWeekData = []
    for (let i = 0; i < 8; i++) {
        let count = data.find((d) => d._id === thisday + i - 7)

        if (count) {
            salesOfLastWeekData.push(count.count)
        } else {
            salesOfLastWeekData.push(0)
        }
    }
 
    resolve(salesOfLastWeekData)

})
 },


getSearchedProducts:(data)=>{
    return new Promise(async(resolve,reject)=>{
    let products=  await db.get().collection(collection.PRODUCT_COLLECTIONS).find({}).toArray()
    
    let result ={}
     result = products.filter(product => (
        product.product.toLowerCase().includes(data.toLowerCase()) || 
        product.category.toLowerCase().includes(data.toLowerCase()) ||
        product.subCategory.toLowerCase().includes(data.toLowerCase()) 
        
    ))
    
    resolve(result)
    })
}
 



    }
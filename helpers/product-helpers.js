var db = require('../config/connection')
var collection = require("../config/collections")
var ObjectId = require("mongodb").ObjectId;
const { ObjectID } = require('bson');
const { response } = require('express');
const { Forbidden } = require('http-errors');
module.exports = {
    addProduct: (product, callback) => {
        return new Promise(async (resolve, reject) => {

            let id = await db.get().collection(collection.PRODUCT_COLLECTIONS).insertOne(product)

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
    addsubCategory: (data) => {
        return new Promise(async (resolve, reject) => {
            console.log(data);
            console.log(data.subcategory);
            let category = data.category
            let subcategory=data.subcategory
            let checkSubCategory = await db.get().collection(collection.CATEGORY_COLLECTIONS).find().toArray()
            checkSubCategory.forEach((i) => {
                if (i.subcategory) {
                   
                    db.get().collection(collection.CATEGORY_COLLECTIONS).updateOne({ category: data.category }, { $push: { subcategory: {$each:[data.subcategory]} } })
                        console.log("there is sub cat");
                }
                else {
                    // db.get().collection(collection.CATEGORY_COLLECTIONS).updateOne({ category: data.category },
                    //     { $set: { subcategory: { $each: [subcategory] } } })
                    db.get().collection(collection.CATEGORY_COLLECTIONS).updateOne({category: data.category},
{$push:{subcategory:{$each:[data.subcategory]}}})

                    console.log("there is no sub cat");
                }

            })



        })

    }
}
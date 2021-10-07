var db=require('../config/connection')
var collection=require("../config/collections")
module.exports = {
    addProduct:(product,callback)=>{
        return new Promise(async(resolve,reject)=>{

            let id= await  db.get().collection('product').insertOne(product)
                   
             resolve(id.insertedId)
            
        })
        
    }
}
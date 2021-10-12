var db=require('../config/connection')
var collection=require("../config/collections")
const bcyrpt=require('bcrypt')
var ObjectId = require("mongodb").ObjectId
const { response } = require('express')
const { get } = require('../routes/admin')
const { USER_COLLECTIONS } = require('../config/collections')
//const { ObjectID, ObjectId } = require('bson')
module.exports={
   doSignup:(userData)=>{
       {userData}
       return new Promise(async(resolve,reject)=>{
           userData.status=true;
           userData.password=await bcyrpt.hash(userData.password,10)
           db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then((data)=>{
               resolve(data)
           })
       })
  
   },
   doLogin:(userData)=>{
       return new Promise(async(resolve,reject)=>{
           let loginStatus=false;
           let response={}
           let user=await db.get().collection(collection.USER_COLLECTIONS).findOne({email:userData.email})
          console.log(user);
          let usersStatus=true
           usersStatus=user.status
           if(user && usersStatus)
           {
             bcyrpt.compare(userData.password,user.password).then((status)=>{
               if(status)
               {
                   console.log("login success");
                   response.user=user
                   response.status=true;
                   resolve(response)
               }  
               else{
                  
                   resolve({status:false})
                 
               }
               
             }).catch(()=>{
                 console.log("error");
             })
           }
           else{
               console.log("login failed");
               resolve({status:false})
            }
         
       });
   },
   getUserDetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let users=await  db.get().collection(collection.USER_COLLECTIONS).find().toArray()
      resolve(users)
    });
},
disableUser:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTIONS).updateOne({_id:ObjectId(userId)},[{$set:{status:false}}]).then((response)=>{
          resolve(response);      
        })
    })
},
enableUser:(userId)=>{
    return new Promise((resolve,rejcet)=>{
       
       db.get().collection(collection.USER_COLLECTIONS).updateOne({_id:ObjectId(userId)},[{$set:{status:true}}]).then((response)=>{
            resolve()
       
        })
    })
},  
addToCart:(proId,userId)=>{
    return new Promise(async(resolve,rejcet)=>{
        let userCart =await db.get().collection(collection.CART_COLLECTIONS).findOne({user:ObjectId(userId)})
        console.log(userCart);

        if(userCart){

        }
        else{
           
            let cartObj={
                user:ObjectId(userId),
                products:[ObjectId(proId)]
            }
            db.get().collection(collection.CART_COLLECTIONS).insertOne(cartObj).then((response)=>{
                 resolve()
            })
            
        }
    })
}
}

 
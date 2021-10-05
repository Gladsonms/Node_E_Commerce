var db=require('../config/connection')
var collection=require("../config/collections")
const bcyrpt=require('bcrypt')
const { response } = require('express')
const { get } = require('../routes/admin')
const { USER_COLLECTIONS } = require('../config/collections')
module.exports={
   doSignup:(userData)=>{
       return new Promise(async(resolve,reject)=>{

           userData.password=await bcyrpt.hash(userData.password,10)
           db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then((data)=>{
               //resolve(data.ops[0])
           })
       })
  
   },
   doLogin:(userData)=>{
       return new Promise(async(resolve,reject)=>{
           let loginStatus=false;
           let response={}
           let user=await db.get().collection(collection.USER_COLLECTIONS).findOne({email:userData.email})
        
           if(user)
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
                   console.log("login fail________________");
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
            console.log("working");
       });
   },
   getUserDetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let users=await  db.get().collection(collection.USER_COLLECTIONS).find().toArray()
      resolve(users)
    });
}
}
 
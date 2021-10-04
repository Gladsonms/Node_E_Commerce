var db=require('../config/connection')
var collection=require("../config/collections")
const bcyrpt=require('bcrypt')
const { response } = require('express')
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
          console.log(user +"data");
           console.log(userData);
           console.log(user.email);
           if(user)
           {
             bcyrpt.compare(userData.password,user.password).then((Status)=>{
               if(Status)
               {
                   console.log("login success");
                   response.user=user
                   response.Status=true;
                  resolve(response)
               }  
               else{
                   console.log("login fail");
                   resolve({Status:false})
               }
               
             })
           }
           else{
               console.log("login failed");
               resolve({Status:false})
           }
       })
   }
}
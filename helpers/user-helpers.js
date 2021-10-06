var db=require('../config/connection')
var collection=require("../config/collections")
const bcyrpt=require('bcrypt')
const { response } = require('express')
const { get } = require('../routes/admin')
const { USER_COLLECTIONS } = require('../config/collections')
const { ObjectID, ObjectId } = require('bson')
module.exports={
   doSignup:(userData)=>{
       {userData}
       return new Promise(async(resolve,reject)=>{
           userData.status=true;
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
         
       });
   },
   getUserDetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let users=await  db.get().collection(collection.USER_COLLECTIONS).find().toArray()
      resolve(users)
    });
},
disableUser:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       
        console.log("working");
        db.get().collection(collection.USER_COLLECTIONS).updateOne({_id:ObjectId(userId)},[{$set:{status:{"$not":"status"}}}]).then((response)=>{
          resolve();     
          console.log(response);       
        })
    })
},
enableUser:(userId)=>{
    return new Promise(async(resolve,rejcet)=>{
        console.log("enbale user");
        db.get().collection(collection.USER_COLLECTIONS).updateOne({_id:ObjectId(userId)},[{$set:{status:true}}]).then((response)=>{
            resolve()
            console.log(response);
            console.log("done");
        })
    })
}
}
 
const express =require('express')

const cors = require("cors")
require("./db/Config")

const User = require("./db/User")
const Product = require("./db/Product")

const jwt = require("jsonwebtoken")
const jwtkey= "e-com"

const app = express()
app.use(cors())
app.use(express.json())

// sign up api
app.post("/signup",async (req,res)=>{
    let user = new User(req.body)
    let result=await user.save()
    result= result.toObject()
    delete result.password
    
    jwt.sign({user},jwtkey,{expiresIn:"2h"} ,(err,token)=>{
        if(err){
            res.send("result : something went wrong")
        }
        res.send({result,jwtToken:token})
    })
})

// login api

app.post("/login", async (req,res)=>{
    if(req.body.email && req.body.password){
        let user=await User.findOne(req.body).select("-password")
        if(user){
            jwt.sign({user},jwtkey,{expiresIn:"2h"} ,(err,token)=>{
                if(err){
                    res.send("result : something went wrong")
                }
                res.send({user,jwtToken:token})
            })
          
        }else{
            res.send("result : no user found")
        }
    }else {
        res.send('enter credentials')
    }
})

// products add api
app.post("/add_product",async (req,res)=>{
            let product = new Product(req.body)
            let result = await product.save()
            res.send(result)
  })

  // fetch products

  app.get("/products",async (req,res)=>{
      let products= await Product.find({})
      if(products.length>0){
        res.send(products)
      }else{
          res.send("no products found")
      }
  })

// delete api

app.delete("/products/:id",async (req,res)=>{
    let result =await Product.deleteOne({_id:req.params.id})
    res.send(result)
})

// update api

app.put("/products/update/:id", async (req,res)=>{
    let result = await Product.updateOne({_id:req.params.id},{$set:req.body})
    res.send(result)
})

// single product search

app.get("/products/:id", async (req,res)=>{
    let result = await Product.findOne({_id:req.params.id})
    if(result){
        res.send(result)
    }else{
        res.send("no product found")
    }
})

// search api

app.get("/products/search/:key",verifyToken,async(req,res)=>{
    let result = await Product.find({
        "$or":[
            {name:{$regex:req.params.key}}
        ]
    })

    res.send(result)
})

// use this middleware/function in the apis where you want token authorization
function verifyToken(req,res,next){
    let token = req.headers['authorization'];
    if(token){
        token = token.split(" ")[1] // if we use bearer , we have to drop bearer from autho...
        console.log("middle ware called",token)
            jwt.verify(token,jwtkey,(err,valid)=>{
                if(err){
                    res.status(403).send({result:"please provide token"})
                }else{
                    next()
                }
            })
    
    }else{
        res.status(401).send({result:"please provide token"})
    }
}


app.listen(3000)
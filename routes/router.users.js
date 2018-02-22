const express = require('express')
const router = express.Router()
const User = require('../models/user')

//sign up a user
router.post('/users', (req,res,next) => {
  const {username, password, fullname} = req.body
  for(let field in req.body) {
    console.log(typeof field)
    if(typeof req.body[field] !== 'string'){
      const err = new Error(`${field} must be a string`)
      err.status = 400
      return next(err)
    }
  }
  if(!username || ! password){
    //missing username or password 
    const err = new Error('missing username or password')
    err.status = 422
    return next(err)
  }
  const sizeFields = {
    username:{
      min: 1
    },
    password:{
      min:8,
      max:72
    }
  }
  const tooSmallField = Object.keys(sizeFields).find( field => {
    return 'min' in sizeFields[field] && req.body[field].trim().length < sizeFields[field].min
  })

  const tooLargeField = Object.keys(sizeFields).find(field => {
    return 'max' in sizeFields[field] && req.body[field].trim().length > sizeFields[field].max
  })

  if(tooSmallField || tooLargeField) {
    const err = new Error(tooSmallField
      ?`Must be ${sizeFields[tooSmallField].min} characters long`
      :`Must be ${sizeFields[tooLargeField].max} characters long`)
    err.status = 422
    err.location = tooSmallField || tooLargeField
    return next(err)
  }

  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname
      }
      return User.create(newUser)
    })
    .then(result => {
      return res.status(201).location(`/v3/users/${res.id}`).json(result)
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The username already exists')
        err.status = 400
      }
      next(err)
    })
})
module.exports = router
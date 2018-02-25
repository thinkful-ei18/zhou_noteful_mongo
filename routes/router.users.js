const express = require('express')
const router = express.Router()
const User = require('../models/user')


//sign up a user
router.post('/users', (req,res,next) => {
  const {username, password, fullname} = req.body

  // validate type string
  for(let field in req.body) {
    if(typeof req.body[field] !== 'string'){
      const err = new Error(`${field} must be a string`)
      err.status = 422
      return next(err)
    }
  }

  // validate missing username or password
  if(!username || ! password){
    //missing username or password 
    const err = new Error('missing username or password')
    err.status = 422
    return next(err)
  }
  const sizeFields = {
    username:{
      min: 2
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

  //validate length restriction
  if(tooSmallField || tooLargeField) {
    const err = new Error(tooSmallField
      ?`${tooSmallField} must be at least ${sizeFields[tooSmallField].min} characters long`
      :`${tooLargeField} must be at most ${sizeFields[tooLargeField].max} characters long`)
    err.status = 422
    err.location = tooSmallField || tooLargeField
    return next(err)
  }

  //validate input trim (white space)
  if(username.length !== username.trim().length){
    const err = new Error('username can not start or end with whitespace')
    err.status = 422
    return next(err)
  }
  if(password.length !== password.trim().length){
    const err = new Error('password can not start or end with whitespace')
    err.status = 422
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
        err = new Error('The username has already exist')
        err.status = 400
      }
      next(err)
    })
})
module.exports = router
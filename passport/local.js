const passport = require('passport')
const User = require('../models/user')
const {Strategy: LocalStrategy} = require('passport-local')

const localStrategy = new LocalStrategy( (username,password,done) => {
  User.findOne({username})
    .then(user => {
      if(!user){
        //user login error
        return Promise.reject({
          reason: 'LoginError',
          message:'Incorrect username',
          location: 'username'
        })
      }
      const isValid = user.validatePassword(password)
      if(!isValid){
        // password login error
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect password',
          location: 'password'
        })
      }
      return done(null, user)
    })
    .catch(err => {
      if(err.reason === 'LoginError'){
        return done(null, false)
      }
      return done(err)
    })
})

module.exports = localStrategy
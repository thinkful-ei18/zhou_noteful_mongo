const User = require('../models/user')
const {Strategy: LocalStrategy} = require('passport-local')

const localStrategy = new LocalStrategy( (username,password,done) => {
  let mUser
  User.findOne({username})
    .then(user => {
      if(!user){
        console.log('user does not found');
        
        //user login error
        return Promise.reject({
          reason: 'LoginError',
          message:'Incorrect username',
          location: 'username'
        })
      }
      mUser = user
      return user.validatePassword(password)
    })
    .then(isValid => {
      if(!isValid){
        console.log('password is wrong');
        // password login error
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect password',
          location: 'password'
        })
      }
      return done(null,mUser)
    })
    .catch(err => {
      if(err.reason === 'LoginError'){
        return done(null, false)
      }
      return done(err)
    })
})

module.exports = localStrategy
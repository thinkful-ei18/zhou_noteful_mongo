const express = require('express')
const router = express.Router()
const passport = require('passport')

const options = {session: false, failWithError: true}
const localAuth = passport.authenticate('local', options)

const jwt = require('jsonwebtoken')
const {JWT_SECRET, JWT_EXPIRY} = require('../config')
//login in as a user
router.post('/login', localAuth, (req,res,next) => {
  const authToken = createAuthToken(req.user)
  res.status(200).json({authToken})
})

const jwtAuth = passport.authenticate('jwt', {session:false, failWithError:true})
router.post('/refresh', jwtAuth, (req,res,next) => {
  const authToken = createAuthToken(req.user)
  res.status(200).json({authToken})
})

function createAuthToken (user) {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  })
}
module.exports = router
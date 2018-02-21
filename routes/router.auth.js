const express = require('express')
const router = express.Router()
const passport = require('passport')

const options = {session: false, failWithError: true}
const localAuth = passport.authenticate('local', options)
//login in as a user
router.post('/login', localAuth, (req,res,next) => {
  res.json(req.user)
})

module.exports = router

const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../server')
const User = require('../models/user')
const expect = chai.expect
const mongoose = require('mongoose')
chai.use(chaiHttp)

const jwt = require('jsonwebtoken')
const {JWT_SECRET, TEST_DATABASE_URL} = require('../config')

describe('Auth endpoints on /login', function () {
  const username1 = 'jone1'
  const password1 = 'snow5408'
  const fullname = 'zhouyang'
  let userId
  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => {
        return mongoose.connection.dropDatabase()
      })
  })
  after(function () {
    return mongoose.disconnect()
  })
  beforeEach(function () {
    return User.hashPassword(password1)
      .then(hash => {
        return User.create({
          username:username1,
          password:hash,
          fullname
        })
      })
      .then(user => {
        userId = user.id
        return true
      })
  })
  afterEach(function () {
    return User.remove()
  })

  describe('/v3/login', function() {
    it('should reject requests with incorrect username', function () {
      return chai.request(app)
        .post('/v3/login')
        .send({username:'3393', password:password1})
        .then(res => {
          expect(res).to.not.exist
        })
        .catch(err => {
          expect(err.response).to.have.status(401)
        })
    })

    it('should reject requests with incorrect password', function () {
      return chai.request(app)
        .post('/v3/login')
        .send({username:username1, password:'newlife5408'})
        .then(res => {
          expect(res).to.not.exist
        })
        .catch(err => {
          if(err instanceof chai.AssertionError) {
            throw err
          }
          
        })
    })

    it('should return a valid token', function() {
      return chai.request(app).post('/v3/login')
        .send({username:username1,password:password1})
        .then(res => {
          expect(res).to.have.status(200)
          expect(res).to.be.an('object')
          const token = res.body.authToken
          expect(token).to.be.a('string')
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm:['HS256']
          })
          expect(payload.user).to.deep.equal({
            id: userId,username:username1,fullname
          })
        })
    })
  })
  
})


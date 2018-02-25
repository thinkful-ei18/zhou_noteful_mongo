
const app = require('../server')
const {TEST_DATABASE_URL} = require('../config')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
const User = require('../models/user')

chai.use(chaiHttp)


describe('/v3/users', function () {
  const username1 = 'jone1'
  const password1 = 'snow5408'
  const fullname1 = 'jone snow1'
  const username2 = 'jone2'
  const password2 = 'snow5408'
  const fullname2 = 'jone snow2'

  
  before(function(){
    return mongoose.connect(TEST_DATABASE_URL)
  })
  beforeEach(function() {
    return mongoose.connection.dropDatabase()
      .then(() => {
        User.ensureIndexes()
      })
  })
  after(function() {
    return mongoose.disconnect()
  })

  afterEach(function () {
    return User.remove()
  })

  it('should reject user with missing username', function() {
    return chai.request(app)
      .post('/v3/users')
      .send({password:password1, fullname:fullname1})
      .then((res) => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('missing username or password')
      })
  })
  it('should reject user with missing password', function() {
    return chai.request(app)
      .post('/v3/users')
      .send({username:username1, fullname:fullname1})
      .then((res) => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('missing username or password')
      })
  })

  it('should reject users with non-string username', function() {
    return chai.request(app)
      .post('/v3/users')
      .send({username:1234, password:password1, fullname:fullname1})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('username must be a string')
      })
  })
  it('should reject users with non-string password', function() {
    return chai.request(app)
      .post('/v3/users')
      .send({username:username1, password:12345678, fullname:fullname1})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('password must be a string')
      })
  })
  it('should reject users with non-string fullname', function() {
    return chai.request(app)
      .post('/v3/users')
      .send({username:username1, password:password1, fullname:123445})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('fullname must be a string')
      })
  })

  it('should reject users with non-trimmed username', function() {
    return chai.request(app)
      .post('/v3/users')
      .send({username: ` ${username1} `, password:password1, fullname:fullname1})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('username can not start or end with whitespace')
      })
  })
  it('should reject users with non-trimmed password', function() {
    return chai.request(app)
      .post('/v3/users')
      .send({username:username1, password:` ${password1} `, fullname:fullname1})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('password can not start or end with whitespace')
      })
  })

  it('should reject users with too short username', function() {
    return chai.request(app).post('/v3/users')
      .send({username:'a', password:password1, fullname:fullname1})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('username must be at least 2 characters long')
      })
  })
  it('should reject users with password with less than 8 characters', function() {
    return chai.request(app).post('/v3/users')
      .send({username:username1, password:'snow', fullname:fullname1})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('password must be at least 8 characters long')
      })
  })
  it('should reject users with password with more than than 72 characters', function() {
    const fakePass = 'a'.repeat(73)
    return chai.request(app).post('/v3/users')
      .send({username:username1, password:fakePass, fullname:fullname1})
      .then(res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(422)
        expect(res.body.message).to.equal('password must be at most 72 characters long')
      })
  })

  it('should reject users with duplicate users', function() {
    return User.create({
      username:username1,
      password:password1,
      fullname:fullname1
    })
      .then(() => {
        return chai.request(app).post('/v3/users')
          .send({username:username1, password:password1, fullname: fullname1})
      })
      .then( res => {
        expect(res).to.not.exist
      })
      .catch(err => {
        if(err instanceof chai.AssertionError){
          throw err
        }
        const res = err.response
        expect(res).to.have.status(400)
        expect(res.body.message).to.equal('The username has already exist')
      })
  })
  it('should create a new user', function() {
    return chai.request(app).post('/v3/users').send({username:username1, password:password1, fullname:fullname1})
      .then(res => {
        expect(res).to.have.status(201)
        expect(res.body.username).to.equal(username1)
        expect(res.body.password).to.be.undefined
        return User.findOne()
      })
      .then(user => {
        expect(user.username).to.equal(username1)
        return user.validatePassword(password1)
      })
      .then(pass => {
        expect(pass).to.be.true
      })
  })

  
})

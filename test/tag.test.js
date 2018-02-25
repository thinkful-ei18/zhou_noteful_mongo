const app = require('../server')
const {JWT_SECRET, TEST_DATABASE_URL} = require('../config')

const Tag = require('../models/tag')
const Note = require('../models/note')
const User = require('../models/user')

const mongoose = require('mongoose')
const seedTags = require('../db/seed/tags')
const seedNotes = require('../db/seed/notes')
const seedUsers = require('../db/seed/users')

const chai = require('chai')
const chaiHttp = require('chai-http')
const chaiSpies = require('chai-spies')
const expect = chai.expect
chai.use(chaiHttp)
chai.use(chaiSpies)

const jwt = require('jsonwebtoken')

describe('Tags End Point', function() {

  let userId = '333333333333333333333300'
  let token
  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(()=> mongoose.connection.dropDatabase())
  });
  after(function () {
    return mongoose.disconnect();
  });
  beforeEach(function () {
    return Promise.all([Tag.insertMany(seedTags),
      Note.insertMany(seedNotes),
      User.insertMany(seedUsers),
      Tag.createIndexes(),
      Note.createIndexes()])
      .then(() => {
        return User.findOne({username:'jone1'})
      })
      .then(user => {
        token = jwt.sign({user}, JWT_SECRET, {subject: user.username})
      })
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  describe('Tag GET end point', function() {
    it('should be able access protected end point', function() {
      return chai.request(app).get('/v3/tags')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.length.above(0)
        })
    })
    it('should return all existing data', function(){
      const dbCall = Tag.find({userId})
      const serverCall = chai.request(app).get('/v3/tags')
        .set('Authorization', `Bearer ${token}`)
      return Promise.all([dbCall, serverCall])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        })
    })
    it('should respond with a 400 for improper format id', function(){
      const badId = '000-3-00000000'
      const spy = chai.spy()
      return chai.request(app).get(`/v3/tags/${badId}`)
        .set('Authorization', `Bearer ${token}`)
        .then(spy)
        .then(()=> {
          expect(spy).to.not.have.been.called()
        })
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.eq('improper formatted id')
        })

    })
    it('should respond with a 400 for item does not exist', function(){
      const badId = '222222222222222222222206'
      const spy = chai.spy()
      return chai.request(app).get(`/v3/tags/${badId}`)
        .set('Authorization', `Bearer ${token}`)
        .then(spy)
        .then(()=> {
          expect(spy).to.not.have.been.called()
        })
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.eq('The item does not exist')
        })

    })
  
    it('should return one response on normal call v3/tags/:id', function(){
      let data
      return Tag.findOne()
        .then(_data => {
          data = _data
          return chai.request(app).get(`/v3/tags/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.an('object')
          expect(res.body).to.have.keys('id','name','userId')
          //comparison
          expect(res.body.id).to.equal(data.id)
          expect(res.body.name).to.equal(data.name)
        })
    })
  })
  
  describe('POST /v3/tags', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'name': 'Ready'
      };
      return chai.request(app)
        .post('/v3/tags')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function (res) {
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
        })
    });

    it('should return error 400 trying to post an missing field', function(){
      const newItem = {random: 'not a thing'}
      const spy = chai.spy()
      // 1) First, call the API
      return chai.request(app)
        .post('/v3/tags')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('missing name')
        })
    })

    it('should not be allowed to post duplicate tags', function(){

      return chai.request(app).post('/v3/tags').send({name:'foo'})
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.not.exist
        })
        .catch(err =>{
          if(err instanceof chai.AssertionError){
            throw err
          }
          const res = err.response
          expect(res).to.have.status(404)
          expect(res.body.message).to.equal('tag name has already exist')
        })


    })
  });
  
  describe('Update route on /v3/tags/:id', function(){
  
    it('should return the updated result', function() {
      const updateData = {
        name:'not my taste'
      }
      let data
      return Tag.findOne()
        .then(_data => {
          data = _data
          return chai.request(app).put(`/v3/tags/${data.id}`).send(updateData)
            .set('Authorization', `Bearer ${token}`)
        })
        .then(res=> {
          expect(res).to.have.status(201)
          expect(res).to.have.be.json
          expect(res.body).to.be.an('object')
          // comparison
          expect(res.body.id).to.equal(data.id)
          expect(res.body.name).to.equal(updateData.name)
        })
    })
  
    it('should not be allowed to update duplicate folder', function(){
      return chai.request(app).put('/v3/tags/222222222222222222222202')
        .set('Authorization', `Bearer ${token}`)
        .send({name:'foo'})
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(404)
          expect(res.body.message).to.equal('tag name has already exist')
        })
    })

    it('should respond with 400 when try to update an improper id', function() {
      const updateData = {
        name:'I have a good name'
      }
      const noteId = '387387587'
      const spy = chai.spy()
      return chai.request(app).put(`/v3/tags/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .then(spy)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('improper formatted id')
        })
        .then(()=>{
          expect(spy).to.not.be.called()
        })
    })
  
    it('should respond `missing field` when try to update without field', function() {
      const updateData = {loo: 'not me'}
      const spy = chai.spy()
      return Tag.findOne().then(data => {
        return chai.request(app).put(`/v3/tags/${data.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
      })
        .then(spy)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('missing name')
        })
        .then(()=>{
          expect(spy).to.not.be.called()
        })
    })
  })
  
  describe(' v3/tags/:id DELETE ', function(){
    
    it('should return a response on  success delete', function(){
      let tagId = '222222222222222222222201'
      return chai.request(app).delete(`/v3/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`)      
        .then(res => {
          expect(res).to.have.status(204)
          expect(res.body).to.be.empty
          return Tag.findById(tagId)
        })
        .then(data => {
          // confirm that database is cleared
          expect(data).to.equal(null)
          return Note.find({tags: tagId})
        })
        .then(results => {
          expect(results).to.be.empty
        })
    })
  
    it('should warn status 400 when tried to delete improper id',function(){
      const badId = '1458'
      return chai.request(app).delete(`/v3/tags/${badId}`)
        .set('Authorization', `Bearer ${token}`)      
        .catch(err => {
          const res = err.response
          expect(err).to.have.status(400)
          expect(res.body.message).to.equal('improper formatted id')
        })
    })
  })
})



const app = require('../server')
const {TEST_DATABASE_URL} = require('../config')
const Tag = require('../models/tag')
const mongoose = require('mongoose')
const seedTags = require('../db/seed/tags')
const chai = require('chai')
const chaiHttp = require('chai-http')
const chaiSpies = require('chai-spies')
const expect = chai.expect
chai.use(chaiHttp)
chai.use(chaiSpies)

describe('Tags End Point', function() {

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(()=> mongoose.connection.dropDatabase())
  });
  after(function () {
    return mongoose.disconnect();
  });
  beforeEach(function () {
    return Tag.insertMany(seedTags)
  });
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  describe('Folder GET end point', function() {
    it('should return all existing data', function(){
      const dbCall = Tag.find()
      const serverCall = chai.request(app).get('/v3/tags')
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
        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.an('object')
          expect(res.body).to.have.keys('id','name')
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
        .send(newItem)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('missing name')
        })
    })

    it('should not be allowed to post duplicate tags', function(){
      return chai.request(app).post('/v3/tags').send({name:'foo'})
        .catch(err =>{
          const res = err.response
          expect(res).to.have.status(404)
          expect(res.body.message).to.equal('tag name has already exist')
        })
    })
  });
  
  // describe('Update route on /v3/folders/:id', function(){
  
  //   it('should return the updated result', function() {
  //     const updateData = {
  //       name:'not my taste'
  //     }
  //     let data
  //     return Folder.findOne()
  //       .then(_data => {
  //         data = _data
  //         return chai.request(app).put(`/v3/folders/${data.id}`).send(updateData)
  //       })
  //       .then(res=> {
  //         expect(res).to.have.status(201)
  //         expect(res).to.have.be.json
  //         expect(res.body).to.be.an('object')
  //         // comparison
  //         expect(res.body.id).to.equal(data.id)
  //         expect(res.body.name).to.equal(updateData.name)
  //       })
  //   })
  
  //   it('should not be allowed to update duplicate folder', function(){
  //     const spy = chai.spy()
  //     return chai.request(app).put('/v3/folders/111111111111111111111101').send({name:'Archive'})
  //       .catch(err => {
  //         const res = err.response
  //         expect(res).to.have.status(404)
  //         expect(res.body.message).to.equal('folder name has already exist')
  //         return 
  //       })
  //   })

  //   it('should respond with 400 when try to update an improper id', function() {
  //     const updateData = {
  //       name:'I have a good name'
  //     }
  //     const noteId = '387387587'
  //     const spy = chai.spy()
  //     return chai.request(app).put(`/v3/folders/${noteId}`).send(updateData)
  //       .then(spy)
  //       .catch(err => {
  //         const res = err.response
  //         expect(res).to.have.status(400)
  //         expect(res.body.message).to.equal('improper formatted id')
  //       })
  //       .then(()=>{
  //         expect(spy).to.not.be.called()
  //       })
  //   })
  
  //   it('should respond `missing field` when try to update without field', function() {
  //     const updateData = {foo: 'not me'}
  //     const spy = chai.spy()
  //     return Folder.findOne().then(data => {
  //       return chai.request(app).put(`/v3/folders/${data.id}`).send(updateData)
  //     })
  //       .then(spy)
  //       .catch(err => {
  //         const res = err.response
  //         expect(res).to.have.status(400)
  //         expect(res.body.message).to.equal('missing field')
  //       })
  //       .then(()=>{
  //         expect(spy).to.not.be.called()
  //       })
  //   })
  // })
  
  // describe(' v3/folders/:id DELETE ', function(){
    
  //   it('should return a response on  success delete', function(){
  //     let data;
  //     return Folder.findOne()
  //       .then( _data => {
  //         data = _data
  //         return chai.request(app).delete(`/v3/folders/${data.id}`)
  //       })
  //       .then(res => {
  //         expect(res).to.have.status(204)
  //         expect(res.body).to.be.empty
  //         return Folder.findById(data.id)
  //       })
  //       .then(data => {
  //         // confirm that database is cleared
  //         expect(data).to.equal(null)
  //       })
  //   })
  
  //   it('should warn status 400 when tried to delete improper id',function(){
  //     const badId = '1458'
  //     return chai.request(app).delete(`/v3/folders/${badId}`)
  //       .catch(err => {
  //         const res = err.response
  //         expect(err).to.have.status(400)
  //         expect(res.body.message).to.equal('improper formatted id')
  //       })
  //   })
  // })
})



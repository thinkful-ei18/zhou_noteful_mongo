const app = require('../server')
const {TEST_DATABASE_URL} = require('../config')
const Folder = require('../models/folder')
const Note = require('../models/note')
const mongoose = require('mongoose')
const seedFolders = require('../db/seed/folders')
const seedNotes = require('../db/seed/notes')
const chai = require('chai')
const chaiHttp = require('chai-http')
const chaiSpies = require('chai-spies')
const expect = chai.expect
chai.use(chaiHttp)
chai.use(chaiSpies)

describe('Note End Point', function() {

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(()=> mongoose.connection.db.dropDatabase())
  });
  after(function () {
    return mongoose.disconnect();
  });
  beforeEach(function () {
    const noteInsertPromise = Note.insertMany(seedNotes);
    const folderInsertPromise = Folder.insertMany(seedFolders);
    return Promise.all([noteInsertPromise, folderInsertPromise])
      .then(() => Note.createIndexes())
      .then(()=> Folder.createIndexes())
  });
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  describe('Note GET end point', function() {
    it('should return all existing data', function(){
      const dbCall = Note.find()
      const serverCall = chai.request(app).get('/v3/notes')
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
      return chai.request(app).get(`/v3/notes/${badId}`)
        .then(spy)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.eq('The `id` is not valid')
        })
        .then(()=> {
          expect(spy).to.not.have.been.called()
        })
    })
    it('should respond with a 400 for item does not exist', function(){
      const badId = '000000000000000000000009'
      const spy = chai.spy()
      return chai.request(app).get(`/v3/notes/${badId}`)
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
  
    
  
    it('should return one response on v3/notes/:id', function(){
      let data
      return Note.findOne()
        .then(_data => {
          data = _data
          return chai.request(app).get(`/v3/notes/${data.id}`)
        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.an('object')
          expect(res.body).to.have.keys('id','title','content','created')
          //comparison
          expect(res.body.id).to.equal(data.id)
          expect(res.body.title).to.equal(data.title)
          expect(res.body.content).to.equal(data.content)
        })
    })
  })
  
  describe('POST /v3/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'tags': []
      };
      let body;
      // 1) First, call the API
      return chai.request(app)
        .post('/v3/notes')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(body).to.be.a('object');
          // 2) **then** call the database
          return Note.findById(body.id);
        })
        // 3) **then** compare
        .then(data => {
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
        });
    });
  });
  
  describe('Update route on /v3/notes/:id', function(){
  
    it('should return the updated result', function() {
      const updateData = {
        title: 'not a good day',
        content:'It could be worse'
      }
      let data
      return Note.findOne()
        .then(_data => {
          data = _data
          return chai.request(app).put(`/v3/notes/${data.id}`).send(updateData)
        })
        .then(res=> {
          expect(res).to.have.status(201)
          expect(res).to.have.be.json
          expect(res.body).to.be.an('object')
          // comparison
  
          expect(res.body.id).to.equal(data.id)
          expect(res.body.title).to.equal(updateData.title)
          expect(res.body.content).to.equal(updateData.content)
        })
    })
  
    it('should respond with 400 when try to update an invalid object', function() {
      const updateData = {
        title: 'not a good day',
        content:'It could be worse'
      }
      const noteId = '387387587'
      const spy = chai.spy()
      return chai.request(app).put(`/v3/notes/${noteId}`).send(updateData)
        .then(spy)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('not a valid id')
        })
        .then(()=>{
          expect(spy).to.not.be.called()
        })
    })
  
    
    it('should respond `missing title` when try to update without title', function() {
      const updateData = {
        content:'It could be worse'
      }
      const spy = chai.spy()
      return Note.findOne().then(data => {
        return chai.request(app).put(`/v3/notes/${data.id}`).send(updateData)
      })
        .then(spy)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('missing title')
        })
        .then(()=>{
          expect(spy).to.not.be.called()
        })
    })
  })
  
  describe(' v3/notes/:id DELETE ', function(){
    
    it('should return a response on  success delete', function(){
      let data;
      return Note.findOne()
        .then( _data => {
          data = _data
          return chai.request(app).delete(`/v3/notes/${data.id}`)
        })
        .then(res => {
          expect(res).to.have.status(204)
          expect(res.body).to.be.empty
          return Note.findById(data.id)
        })
        .then(data => {
          // confirm that database is cleared
          expect(data).to.equal(null)
        })
    })
  
    it('should warn status 400 when tried to delete improper id',function(){
      const badId = '1458'
      return chai.request(app).delete(`/v3/notes/${badId}`)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('improper id')
        })
    })
  })
})



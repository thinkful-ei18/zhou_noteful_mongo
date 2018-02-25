const app = require('../server')
const {JWT_SECRET, TEST_DATABASE_URL} = require('../config')
const Folder = require('../models/folder')
const Note = require('../models/note')
const User = require('../models/user')
const Tag = require('../models/tag')
const mongoose = require('mongoose')
const seedFolders = require('../db/seed/folders')
const seedNotes = require('../db/seed/notes')
const seedUsers = require('../db/seed/users')
const seedTags = require('../db/seed/tags')
const chai = require('chai')
const chaiHttp = require('chai-http')
const chaiSpies = require('chai-spies')
const expect = chai.expect
chai.use(chaiHttp)
chai.use(chaiSpies)
const jwt = require('jsonwebtoken')


describe('Note End Point', function() {
  const userId = '333333333333333333333300'
  let token
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
    const tagInsertPromise = Tag.insertMany(seedTags)
    const userInsertPromise = seedUsers.map(user => {
      return User.hashPassword(user.password)
        .then(hash => {
          const newUser = {
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            password: hash
          }
          return User.create(newUser)
        })
    })
    return Promise.all([noteInsertPromise, folderInsertPromise, userInsertPromise, tagInsertPromise])
      .then(() => Note.createIndexes())
      .then(()=> Folder.createIndexes())
      .then(() => {
        return User.findOne({_id: userId})
      })
      .then(user => {
        token = jwt.sign({user}, JWT_SECRET, {subject: user.username})
      })
  });
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  describe('Authentication on /v3/notes',function() {
    describe('Authentication on get route',function() {
      it('should not be allowed to visit with un-authorized user',function() {
        return chai.request(app).get('/v3/notes')
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            expect(err.response).to.have.status(401)
            expect(err.response.body.message).to.equal('Unauthorized')
          })
      })
  
      it('should not be allowed to visit with un-authorized user',function() {
        return chai.request(app).get('/v3/notes')
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            expect(err.response).to.have.status(401)
            expect(err.response.body.message).to.equal('Unauthorized')
          })
      })

      it('should not allow a user to have access to other users\' notes', function() {
        const badNoteId = '000000000000000000000004'
        return chai.request(app).get(`/v3/notes/${badNoteId}`).set('Authorization', `Bearer ${token}`)
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            const res = err.response
            expect(res).to.have.status(400)
            expect(res.body.message).to.equal('The item does not exist')
          })
      })
    })
    describe('Authentication on post route',function() {

      it('should not allow a user to have access to other users\' folders', function() {
        const newNote = {
          title: 'newNote',
          content: 'newContent',
          userId,
          folderId:'111111111111111111111104'
        }
        return chai.request(app).post('/v3/notes').set('Authorization', `Bearer ${token}`)
          .send(newNote)
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            const res = err.response 
            
            expect(res).to.have.status(422)
            expect(res.body.message).to.equal('invalid to assign this folder')
          })
      })
      it('should not allow a user to have access to other users\' tags', function() {
        const newNote = {
          title: 'newNote',
          content: 'newContent',
          userId,
          tags:['222222222222222222222200','222222222222222222222204']
        }
        return chai.request(app).post('/v3/notes').set('Authorization', `Bearer ${token}`)
          .send(newNote)
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            const res = err.response 
            
            expect(res).to.have.status(422)
            expect(res.body.message).to.equal(' invalid to assign one of the tags')
          })
      })
  
    })
    describe('Authentication on put route', function() {

      it('should not allow a user to have access to other users\' notes', function() {
        const badNoteId = '000000000000000000000004'
        const badUpdate = {
          title:'The most incredible article about cats you\'ll ever read'
        }
        return chai.request(app).put(`/v3/notes/${badNoteId}`).set('Authorization', `Bearer ${token}`)
          .send(badUpdate)
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            const res = err.response
            expect(res).to.have.status(400)
            expect(res.body.message).to.equal('The item does not exist')
          })
      })
      it('should not allow a user to have access to other users\' folders', function() {
        const update = {
          title: 'newNote',
          content: 'newContent',
          folderId:'111111111111111111111104'
        }
        return chai.request(app).put('/v3/notes/000000000000000000000000').set('Authorization', `Bearer ${token}`)
          .send(update)
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            const res = err.response 
            
            expect(res).to.have.status(422)
            expect(res.body.message).to.equal('invalid to assign this folder')
          })
      })
      it('should not allow a user to have access to other users\' tags', function() {
        const update = {
          title: 'newNote',
          content: 'newContent',
          tags:['222222222222222222222200','222222222222222222222204']
        }
        return chai.request(app).put('/v3/notes/000000000000000000000000').set('Authorization', `Bearer ${token}`)
          .send(update)
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            const res = err.response 
            expect(res).to.have.status(422)
            expect(res.body.message).to.equal(' invalid to assign one of the tags')
          })
      })
  
     
    })
    describe('Authentication on delete route', function() {
      it('should not allow user to delete other users\' notes', function() {
        return chai.request(app).delete('/v3/notes/000000000000000000000004')
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            expect(res).to.not.exist
          })
          .catch(err => {
            if(err instanceof chai.AssertionError){
              throw err
            }
            const res = err.response
            expect(res).status(400)
            expect(res.body.message).to.equal('This item does not exist')
          })
      })
    })
    
  })

  describe('Note GET end point', function() {
    it('should return all existing data on Get /v3/notes', function(){
      const dbCall = Note.find({userId})
      const serverCall = chai.request(app).get('/v3/notes')
        .set('Authorization', `Bearer ${token}`)
      return Promise.all([dbCall, serverCall])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        })
    })

    it('should narrow final results with query on Get /v3/notes', function(){
      const query = 
      {
        searchTerm : 'gaga',
        folderId : '111111111111111111111100',
        tagId:'222222222222222222222200'
      }
      return chai.request(app).get('/v3/notes?searchTerm=gaga&folderId=111111111111111111111100&222222222222222222222200')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.length(1)
        })
    })

    it('should respond with a 400 for improper format id', function(){
      const badId = '000-3-00000000'
      const spy = chai.spy()
      return chai.request(app).get(`/v3/notes/${badId}`)
        .set('Authorization', `Bearer ${token}`)
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
  
    
  
    it('should return one response on v3/notes/:id', function(){
      let data
      return Note.findOne()
        .then(_data => {
          data = _data
          return chai.request(app).get(`/v3/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.an('object')
          expect(res.body).to.have.keys('id','title','content','created','folderId','tags')
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
        .set('Authorization', `Bearer ${token}`)
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
        content:'It could be worse',
        tags:['222222222222222222222200']
      }
      let data
      return Note.findOne({userId})
        .then(_data => {
          // console.log(_data);
          data = _data

          return chai.request(app).put(`/v3/notes/${data.id}`).send(updateData)
            .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
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
          .set('Authorization', `Bearer ${token}`)
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
      return Note.findOne({userId})
        .then( _data => {
          data = _data
          return chai.request(app).delete(`/v3/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`)
        .catch(err => {
          const res = err.response
          expect(res).to.have.status(400)
          expect(res.body.message).to.equal('improper id')
        })
    })
  })
})



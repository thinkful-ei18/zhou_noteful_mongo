'use strict';
const {app, runServer, closeServer} = require('../server');
const {PORT, TEST_DATABASE_URL} = require('../config')
const seedNotes = require('../db/seed/notes')
const Note = require('../models/note.js')
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const expect = chai.expect;
const mongoose = require('mongoose')
chai.use(chaiHttp);
chai.use(chaiSpies);

before(function(){
  return runServer(TEST_DATABASE_URL, PORT)
})
beforeEach(function(){
  console.log('======================')
  console.log('======================')
  console.log('re-seeding database')
  return seed()
})
afterEach(function(){
  return tearDownDb()
})
after(function(){
  return closeServer()
})

function seed(){
  return Note.insertMany(seedNotes)
}
function tearDownDb(){
  console.warn('Deleting database')
  return mongoose.connection.db.dropDatabase()
}

describe('Reality Check', () => {

  it('true should be true', () => {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4 (except in 1984)', () => {
    expect(2 + 2).to.equal(4);
  });

});

describe('Environment', () => {

  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

});

describe('Basic Express setup', () => {

  describe('Express static', () => {

    it('GET request "/" should return the index page', () => {
      return chai.request(app)
        .get('/')
        .then(function (res) {
          expect(res).to.exist;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
        });
    });

  });

  describe('404 handler', () => {

    it('should respond with 404 when given a bad path', () => {
      const spy = chai.spy();
      return chai.request(app)
        .get('/bad/path')
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch(err => {
          expect(err.response).to.have.status(404);
        });
    });
  });

});

describe('GET end point', function() {
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
      .then(()=> {
        expect(spy).to.not.have.been.called()
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(400)
        expect(res.body.message).to.eq('The `id` is not valid')
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
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('id', 'title', 'content');
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
      .then(()=>{
        expect(spy).to.not.be.called()
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(400)
        expect(res.body.message).to.equal('not a valid id')
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
      .then(()=>{
        expect(spy).to.not.be.called()
      })
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(400)
        expect(res.body.message).to.equal('missing title')
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

  it('should warn status 400 when tried to delete an invalid id',function(){
    const badId = '1458'
    return chai.request(app).delete(`/v3/notes/${badId}`)
      .catch(err => {
        const res = err.response
        expect(res).to.have.status(400)
        expect(res.body.message).to.equal(`${badId} does not exist`)
      })
  })
})




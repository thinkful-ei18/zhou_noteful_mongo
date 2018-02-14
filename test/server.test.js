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
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const{ MONGODB_URL} = require('../config')
const Note = require('../models/note')

const seedNotes = require('../db/seed/notes')

mongoose.connect(MONGODB_URL)
  .then(()=> {
    return mongoose.connection.db.dropDatabase()
      .then(result => {
        console.log(`Dropped Database: ${result}`)
      })
  })
  .then(()=> {
    return Note.insertMany(seedNotes)
      .then(results => {
        console.info(`Inserted ${results.length} Notes`)
      })
  })
  .then(()=> {
    return mongoose.disconnect()
      .then(()=> {
        console.info('Disconnected')
      })
  })
  .catch(err => {
    console.error(`Error: ${err.message}`)
    console.error(err)
  })


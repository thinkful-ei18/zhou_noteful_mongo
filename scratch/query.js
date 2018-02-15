const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const {MONGODB_URL} = require('../config')
const Note = require('../models/note')

mongoose.connect(MONGODB_URL)
  .then(()=>{
    return Note.findById('000000000000000000000002')
  })
  .then((res)=>{
    console.log(res)
    return mongoose.disconnect()
      .then(()=>{
        console.info('Disconnected')
      })
  })
  .catch( err=> {
    console.error(`Error: ${err.message}`)
    console.error(err)
  })
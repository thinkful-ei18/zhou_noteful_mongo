const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const {MONGODB_URL} = require('../config')
const Note = require('../models/note')

mongoose.connect(MONGODB_URL)
  .then(()=>{
    return Note.find(
      // remember to reseed database when change model structure
      {$text: {$search: 'lady gaga'} },
      {score: {$meta: 'textScore'} })
      .sort({score: {$meta :'textScore'} } )
      .then(console.log)
      .catch(console.error)
  })
  .then(()=>{
    return mongoose.disconnect()
      .then(()=>{
        console.info('Disconnected')
      })
  })
  .catch( err=> {
    console.error(`Error: ${err.message}`)
    console.error(err)
  })
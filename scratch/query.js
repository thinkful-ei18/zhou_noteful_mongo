const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const {MONGODB_URL} = require('../config')
const Note = require('../models/note')

const tagId = '222222222222222222222201'
mongoose.connect(MONGODB_URL)
  .then(()=>{
    
    return Note.update(
      {tags:tagId},
      {$pull: {tags: tagId}},
      {multi: true}
    )
  })
  .then(()=>{
    return Note.find({}, {title:1,tags:1})
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
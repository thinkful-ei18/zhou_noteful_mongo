const express = require('express')
const mongoose = require('mongoose')
const Tag = require('../models/tag')
const Note = require('../models/note')
const router = express.Router()

router.get('/tags', (req,res,next) => {
  Tag.find()
    .then(results => {
      res.status(200).json(results)
    })
    .catch(next)
})

router.get('/tags/:id', (req,res,next) => {
  const tagId = req.params.id
  if(!mongoose.Types.ObjectId.isValid(tagId)){
    const err = new Error('improper formatted id')
    err.status = 400
    return next(err)
  }
  Tag.findById(tagId)
    .then(result => {
      if(result){res.status(200).json(result)}
      const err = new Error('The item does not exist')
      err.status = 400
      return next(err)
    })
    .catch(next)
})

router.post('/tags', (req,res,next) => {
  const {name}= req.body
  if(!name){
    const err = new Error('missing name')
    err.status = 400
    return next(err)
  }
  const tag = {name}
  Tag.create(tag)
    .then(result => {
      res.status(201).location(`${req.originalUrl}/${result._doc._id}`).end()
    })
    .catch(err => {
      if(err.code === 11000){
        err = new Error('tag name has already exist')
        err.status = 404
        return next(err)
      }
      next(err)
    })
})

router.put('/tags', (req,res,next) => {

})

router.delete('/tags:id', (req,res,next) => {

})

module.exports = router
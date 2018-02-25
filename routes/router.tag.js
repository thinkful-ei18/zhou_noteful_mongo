const express = require('express')
const mongoose = require('mongoose')
const Tag = require('../models/tag')
const Note = require('../models/note')
const router = express.Router()

router.get('/tags', (req,res,next) => {
  const userId = req.user.id
  Tag.find({userId})
    .then(results => {
      res.status(200).json(results)
    })
    .catch(next)
})

router.get('/tags/:id', (req,res,next) => {
  const tagId = req.params.id
  const userId = req.user.id
  if(!mongoose.Types.ObjectId.isValid(tagId)){
    const err = new Error('improper formatted id')
    err.status = 400
    return next(err)
  }
  Tag.findOne({_id: tagId, userId})
    .then(result => {
      if(result){return res.status(200).json(result)}
      const err = new Error('The item does not exist')
      err.status = 400
      return next(err)
    })
    .catch(next)
})

router.post('/tags', (req,res,next) => {
  const {name}= req.body
  const userId = req.user.id
  if(!name){
    const err = new Error('missing name')
    err.status = 400
    return next(err)
  }
  const tag = {name, userId}
  Tag.create(tag)
    .then(result => {
      res.status(201).location(`${req.originalUrl}/${result._doc._id}`).json(tag)
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

router.put('/tags/:id', (req,res,next) => {
  const {name} = req.body
  const tagId = req.params.id
  const userId = req.user.id
  if(!name) {
    const err = new Error('missing name')
    err.status = 400
    return next(err)
  }
  if(!mongoose.Types.ObjectId.isValid(tagId)){
    const err = new Error('improper formatted id')
    err.status = 400
    return next(err)
  }
  const tag = {name}
  Tag.findOneAndUpdate({_id:tagId, userId},tag,{new:true})
    .then(result => {
      if(result){
        return res.status(201).json(result)
      }
      const err = new Error('The item does not exist')
      err.status = 400
      return next(err)
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

router.delete('/tags/:id', (req,res,next) => {
  const tagId = req.params.id
  const userId = req.user.id
  if(!mongoose.Types.ObjectId.isValid(tagId)){
    const err = new Error('improper formatted id')
    err.status = 400
    return next(err)
  }
  Tag.findOneAndRemove({_id:tagId, userId})
    .then(() => {
      console.log('I success delete tagid')
      return Note.updateMany(
        {tags:tagId},
        {$pull: {tags: tagId}}
      )
    })
    .then(() => {
      res.status(204).json({message: 'delete success'})
    })
    .catch(next)
})

module.exports = router
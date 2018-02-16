const express = require('express')
const mongoose = require('mongoose')
const Folder = require('../models/folder')
const Note = require('../models/note')
const router = express.Router()


router.get('/folders', (req,res,next) => {
  Folder.find()
    .sort({name:1})
    .then(results => {
      res.status(200).json(results)
    })
    .catch(err => {
      next(err)
    })
})

router.get('/folders/:id', (req,res,next) => {
  const reqId = req.params.id
  const err = validateIdFormat(reqId)
  if(err) return next(err)
  Folder.findById(reqId)
    .then(result => {
      if(result){
        return res.status(200).json(result)
      }
      const err = new Error('The item does not exist')
      err.status = 400
      next(err)
    })
    .catch(next)
})


router.put('/folders/:id', (req,res,next) => {
  //@params: id, data, option {new: true}
  const reqId = req.params.id
  const {name} = req.body
  const err = validateIdFormat(reqId) || validateMissingField(name)
  if(err) return next(err)
  const update = {name}
  Folder.findByIdAndUpdate(reqId,update,{new:true})
    .then(result => {
      if(result){
        return res.status(201).json(result)
      }
      next()
    })
    .catch(err => {
      if(err.code === 11000){
        const err = new Error('folder name has already exist')
        err.status = 404
        return next(err)
      }
      next(err)
    })
})

router.post('/folders', (req,res,next)=> {
  const {name} = req.body
  const err = validateMissingField(name)
  if(err) return next(err)
  const newItem = {name}
  Folder.create(newItem)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).end()
    })
    .catch(err => {
      if(err.code === 11000){
        const err = new Error('folder name has already exist')
        err.status = 404
        return next(err)
      }
      next(err)
    })
})

router.delete('/folders/:id', (req,res,next) => {
  const reqId = req.params.id
  const err = validateIdFormat(reqId)
  if(err) return next(err)
  Folder.findByIdAndRemove(reqId)
    .then(() => {
      return Note.deleteMany({folder_id: reqId})
    })
    .then(()=> {
      res.status(204).end()
    })
    .catch(next)
})
//================Validation =======

function validateMissingField(field){
  if(!field){
    const err = new Error('missing field')
    err.status = 400
    return err
  }
}

function validateIdFormat(id){
  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('improper formatted id')
    err.status = 400
    return err
  }
}

module.exports = router
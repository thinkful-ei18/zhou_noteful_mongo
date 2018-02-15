'use strict';

const express = require('express');
// Create an router instance (aka "mini-app")
const router = express.Router();
const Note = require('../models/note')
const mongoose = require('mongoose')
/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
  const {searchTerm} = req.query
  const filter = {}
  filter.search = searchTerm
    ?{$text: {$search: searchTerm}}
    :{}
  Note.find(
    filter.search,
    {score:{$meta:'textScore'}}
  )
    .sort({score:{$meta:'textScore'}})
    .then(results => {
      if(results.length) return res.status(200).json(results)
      next()
    })
    .catch(err => next(err))
});
/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id
  if(!mongoose.Types.ObjectId.isValid(noteId)){
    const err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
  }
  Note.findById(noteId)
    .then(result=> {
      if(result === null){
        const err = new Error('The item does not exist')
        err.status = 400
        return next(err)
      }
      return res.status(200).json(result)
    })
    .catch(next)
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const {title, content} = req.body
  const err = validTitle(title)
  if(err) return next(err)
  Note.create({title,content})
    .then(result => {
      return res.location(`${req.originalUrl}/${result._doc._id}`).status(201).json(result)
    })
    .catch(next)
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id
  const {title, content} = req.body
  const err = validTitle(title)
  if(err) return next(err)
  if(!mongoose.Types.ObjectId.isValid(noteId)){
    const err2 = new Error('not a valid id')
    err2.status = 400
    return next(err2)
  }
  const updateObj = {title, content}
  Note.findByIdAndUpdate(noteId,updateObj,{new:true})
    .then(result => {
      return res.status(201).json(result)
    })
    .catch(next)
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const noteId = req.params.id
  if(!mongoose.Types.ObjectId.isValid(noteId)){
    const err = new Error(`${noteId} does not exist`)
    err.status = 400
    return next(err)
  }
  Note.findByIdAndRemove(noteId)
    .then(()=> {
      res.status(204).end()
    })
})
module.exports = router;

//========== Validation methods =========================
function validTitle(title){
  if(!title){
    const err = Error('missing title')
    err.status = 400
    return err
  }
}
'use strict';

const express = require('express');
// Create an router instance (aka "mini-app")
const router = express.Router();
const Note = require('../models/note')
/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
  const {searchTerm} = req.query
  const filter = {}
  filter.search = searchTerm
    ?{$text: {$search: searchTerm}}
    :{}
  console.log(filter)
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
  Note.findById(req.params.id)
    .then(result=> {
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
      return res.status(201).json(result)
    })
    .catch(next)
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id
  const {title, content} = req.body
  const err = validTitle(title)
  if(err) return next(err)
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
  Note.findByIdAndRemove(noteId)
    .then(()=> {
      res.status(204).end()
    })
});
module.exports = router;

//========== Validation methods =========================
function validTitle(title){
  if(!title){
    const err = Error('missing title')
    err.status = 400
    return err
  }
}
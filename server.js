'use strict';

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan')
const { PORT, MONGODB_URL } = require('./config');
const notesRouter = require('./routes/notes');
// Create an Express application
const app = express();
// Log all requests. Skip logging during
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

// Create a static webserver
app.use(express.static('public'));

// Parse request body
app.use(express.json());

// Mount router on "/api"
app.use('/v3', notesRouter);

// Catch-all 404
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Catch-all Error handler
// Add NODE_ENV check to prevent stacktrace leak
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

let server
// Listen for incoming connections
function runServer(DATABASE_URL = MONGODB_URL, port=PORT){

  return new Promise( (resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if(err){
        return reject(err)
      }
      server = app.listen(port,() => {
        // console.info(`Server listening on ${this.address().port}`);
        console.log('server started')
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect()
          reject(err)
        })
    })
  })
}

function closeServer() {
  return mongoose.disconnect().then(()=> {
    return new Promise( (resolve, reject) => {
      console.log('closing server')
      server.close(err => {
        if(err) {
          return reject(err)
        }
        resolve()
      })
    })
  })
}
// return  mongoose.connect(DATABASE_URL)
//   .then(instance => {
//     const conn = instance.connections[0]
//     console.info(`Connected to :mongodb://${conn.host}:${conn.port}/${conn.name}`)
//   })
//   .catch(err => {
//     console.error(`Error :${err.message}`)
//     console.error('\n === Did you remember to start `mongod`? === \n')
//     console.error(err)
//   })

if(require.main === module){
  runServer()
  // app.listen(PORT, function () {
  //   console.info(`Server listening on ${this.address().port}`);
  // }).on('error', err => {
  //   console.error(err);
  // });
}

module.exports = {app, runServer, closeServer}


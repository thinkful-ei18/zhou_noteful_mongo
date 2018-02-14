'use strict';
exports.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost/noteful'
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/noteful_test'
exports.PORT = process.env.PORT || 8080;

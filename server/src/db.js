// src/db.js
const knex = require('knex');
const config = require('../knexfile');

// NODE_ENV será 'development' si no se define de otra forma
const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

module.exports = db;

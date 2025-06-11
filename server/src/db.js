// NODE_ENV será 'development' si no se define de otra forma
const knex = require('knex');
const config = require('../knexfile');

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const db = knex(config[environment]);

module.exports = db;

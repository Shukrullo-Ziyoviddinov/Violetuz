require('dotenv').config();

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || '';

module.exports = {
  PORT,
  NODE_ENV,
  CLIENT_URL,
  DATABASE_URL,
};

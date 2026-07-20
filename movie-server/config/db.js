const dns = require('dns');
const mongoose = require('mongoose');
const { DATABASE_URL } = require('./env');

const connectDB = async () => {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env');
  }

  // Ba'zi tarmoqlarda mahalliy DNS SRV so'rovini rad etadi
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  mongoose.set('strictQuery', true);

  await mongoose.connect(DATABASE_URL);

  console.log('MongoDB connected successfully');
};

module.exports = connectDB;

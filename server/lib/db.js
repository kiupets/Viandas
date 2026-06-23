const mongoose = require('mongoose');

let connectionPromise;

async function connectDb() {
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/viandas_zarate';
  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB error:', error.message);
  });

  return connectionPromise;
}

module.exports = { connectDb };

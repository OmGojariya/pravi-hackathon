const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/infratrack';
  
  try {
    // Attempt connection with 12s timeout for cloud clusters
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 12000,
    });
    const safeHost = uri.includes('@') ? uri.split('@')[1] : uri;
    console.log(`[Database] Connected successfully to MongoDB at ${safeHost}`);
  } catch (err) {
    console.warn(`[Database] Target MongoDB unavailable (${err.message}). Starting MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected successfully to in-memory MongoDB at ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to initialize in-memory database:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

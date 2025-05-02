import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asssignment_final';

// Global variable to track connection status
let isConnected = false;

export const connectToMongoDB = async () => {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    const options = {
      dbName: "asssignment_final",  // Explicitly set the database name
      serverSelectionTimeoutMS: 30000, // Timeout for server selection
      socketTimeoutMS: 45000, // How long sockets to the server stay active
      connectTimeoutMS: 30000, // Timeout for initial connection
    };

    await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};
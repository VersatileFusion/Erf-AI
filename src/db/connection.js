import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erf_ai';

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Test MongoDB connection
const testConnection = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB connection already established');
      return true;
    } else {
      return await connectToDatabase();
    }
  } catch (error) {
    console.error('MongoDB connection test error:', error);
    return false;
  }
};

// Disconnect from MongoDB
const disconnectFromDatabase = async () => {
  try {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    return false;
  }
};

export { 
  connectToDatabase, 
  testConnection, 
  disconnectFromDatabase,
  mongoose 
}; 
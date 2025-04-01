import { connectToDatabase } from './connection.js';
import mongoose from 'mongoose';

/**
 * Initialize the database
 */
async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Connect to MongoDB
    const connected = await connectToDatabase();
    
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      return false;
    }
    
    console.log('MongoDB connection successful');
    
    // Check if all models are loaded properly
    const models = mongoose.modelNames();
    console.log('Available MongoDB models:', models);
    
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

export { initializeDatabase };

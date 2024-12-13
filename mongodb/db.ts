import mongoose from 'mongoose';

const connectionString = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@linkedin.oepp2.mongodb.net/`;

if (!connectionString) {
  throw new Error('Please provide a valid connection string');
}

const connectDB = async () => {
  if (mongoose.connection?.readyState >= 1) {
    console.log('Already connected');
    return;
  }
  try {
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB');
  }
};

export default connectDB;

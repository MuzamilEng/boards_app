const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://muzi:muzi123@cluster0.quilybs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

    console.log('MongoDB connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
};

module.exports = connectDB;
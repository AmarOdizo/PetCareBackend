let mongoose;
try {
  mongoose = require("mongoose");
} catch (err) {
  console.warn("Mongoose loading notice:", err.message);
}

let isConnected = false;
let connectPromise = null;

const connectDB = function () {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gemini_api";
  
  if (!mongoose) {
    console.log("Database Driver Notice: Running in standalone memory mode.");
    return Promise.resolve(false);
  }

  // Return immediately if fully connected (readyState === 1)
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isConnected = true;
    return Promise.resolve(true);
  }

  // If connection is in progress, return the existing promise so caller awaits it
  if (connectPromise) {
    return connectPromise;
  }

  try {
    mongoose.set('bufferCommands', false);
  } catch(e) {}

  console.log("Connecting to MongoDB...");
  
  connectPromise = mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      bufferCommands: false
    })
    .then(function () {
      isConnected = true;
      console.log("MongoDB Connected Successfully");
      return true;
    })
    .catch(function (error) {
      isConnected = false;
      connectPromise = null; // Allow retry on failure
      console.warn("MongoDB Connection Notice:", error.message || error);
      console.warn("API running in standalone mode without active database connection.");
      return false;
    });

  return connectPromise;
};

connectDB.getStatus = function () {
  return isConnected;
};

module.exports = connectDB;

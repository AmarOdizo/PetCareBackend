let mongoose;
try {
  mongoose = require("mongoose");
} catch (err) {
  console.warn("Mongoose loading notice:", err.message);
}

let isConnected = false;

const connectDB = function () {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gemini_api";
  
  if (!mongoose) {
    console.log("Database Driver Notice: Running in standalone memory mode.");
    return Promise.resolve(false);
  }

  console.log("Connecting to MongoDB at:", mongoURI);
  
  return mongoose
    .connect(mongoURI)
    .then(function () {
      isConnected = true;
      console.log("MongoDB Connected Successfully");
    })
    .catch(function (error) {
      isConnected = false;
      console.warn("MongoDB Connection Notice:", error.message || error);
      console.warn("API running in standalone mode without active database connection.");
    });
};

connectDB.getStatus = function () {
  return isConnected;
};

module.exports = connectDB;

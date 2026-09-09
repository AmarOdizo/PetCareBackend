const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

console.log("Attempting to connect to MongoDB with URI:", mongoURI);

mongoose.connect(mongoURI)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB!");
    console.log("The credentials in your .env file are working correctly.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB.");
    console.error("Error details:", err.message);
    process.exit(1);
  });

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");

const apiRoutes = require("./routes/apiRoutes");
const authRoutes = require("./routes/authRoutes");
const petRoutes = require("./routes/petRoutes");
const vetRoutes = require("./routes/vets");
const appointmentRoutes = require("./routes/appointments");
const consultationRoutes = require("./routes/consultations");
const chatRoutes = require("./routes/chat");
const prescriptionRoutes = require("./routes/prescriptions");
const imagekitRoutes = require("./routes/imagekitRoutes");
const favoriteVetsRoutes = require("./routes/favoriteVets");

// Only connect to MongoDB in Node.js (Mongoose needs TCP sockets, not available in Workers)
if (typeof globalThis.caches === 'undefined') {
  connectDB();
}

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use(function (req, res, next) {
  console.log("[" + new Date().toISOString() + "] " + req.method + " " + req.url);
  next();
});

// Database connection now handled via MongoDB and Mongoose

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/vets", vetRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/imagekit", imagekitRoutes);
app.use("/api/favorites", favoriteVetsRoutes);
app.use("/api", apiRoutes);

// Root Index Route
app.get("/", function (req, res) {
  res.json({
    success: true,
    message: "Welcome to Gemini Backend API Server",
    endpoints: {
      health: "/api/health",
      status: "/api/status",
      login: "/api/auth/login",
      register: "/api/auth/register",
      vets: "/api/vets",
      vetLogin: "/api/vets/login",
      vetRegister: "/api/vets/register",
      pets: "/api/pets",
      imagekitAuth: "/api/imagekit/auth",
      imagekitUpload: "/api/imagekit/upload",
      items: "/api/items"
    }
  });
});

// 404 Route Handler
app.use(function (req, res) {
  res.status(404).json({
    success: false,
    message: "Endpoint not found: " + req.originalUrl
  });
});

// Start Server (only in Node.js, not in Cloudflare Workers)
if (typeof globalThis.caches === 'undefined') {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, function () {
    console.log("==========================================");
    console.log("  Gemini API Server Running Successfully  ");
    console.log("  Port: " + PORT);
    console.log("  Health URL: http://localhost:" + PORT + "/api/health");
    console.log("  Auth Login: http://localhost:" + PORT + "/api/auth/login");
    console.log("  Auth Register: http://localhost:" + PORT + "/api/auth/register");
    console.log("  Vets API: http://localhost:" + PORT + "/api/vets");
    console.log("  Vet Register: http://localhost:" + PORT + "/api/vets/register");
    console.log("  Vet Login: http://localhost:" + PORT + "/api/vets/login");
    console.log("  Pets API: http://localhost:" + PORT + "/api/pets");
    console.log("==========================================");
  });

  // DB seeded via Supabase SQL directly.

  // Keep process active
  setInterval(function () {}, 1000000);
}

module.exports = app;

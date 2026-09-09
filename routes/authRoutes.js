const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Vet = require("../models/Vet");

// Helper function for Vet Login
async function handleVetLogin(req, res, identifier, password) {
  const queryStr = String(identifier).trim();
  const queryRegex = new RegExp('^' + queryStr + '$', 'i');
  
  try {
    const dbVet = await Vet.findOne({
        $or: [{ email: queryRegex }, { vciNumber: queryRegex }]
    });

    if (!dbVet || dbVet.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid Doctor Email/VCI Registration Number or Password."
      });
    }

    const safeVet = dbVet.toObject();
    delete safeVet.password;

    return res.json({
      success: true,
      message: "Veterinarian Doctor Login Successful!",
      token: "vet_token_" + Date.now(),
      vet: safeVet
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/* =========================================================
   USER (PET OWNER) AUTHENTICATION ROUTES
   ========================================================= */

// POST /api/auth/register (Create Owner Account)
router.post("/register", async function (req, res) {
  try {
    const name = req.body.name || req.body.fullName;
    const email = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone || "";
    const role = req.body.role || "owner";

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password."
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check existing
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    // Insert new user
    const newUser = new User({
        name: name,
        email: normalizedEmail,
        password: password,
        phone: phone,
        role: role
    });
    
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token: "token_" + Date.now(),
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration: " + error.message
    });
  }
});

// POST /api/auth/login (User / Role Login)
router.post("/login", async function (req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role || "owner";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter email/VCI number and password."
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (role === "doctor" || role === "vet") {
      return handleVetLogin(req, res, normalizedEmail, password);
    }

    // Check user
    const dbUser = await User.findOne({ email: normalizedEmail });

    if (!dbUser || dbUser.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    return res.json({
      success: true,
      message: "Login successful!",
      token: "token_" + Date.now(),
      user: {
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        phone: dbUser.phone
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login: " + error.message
    });
  }
});

/* =========================================================
   VETERINARIAN (DOCTOR) AUTHENTICATION & MANAGEMENT API
   ========================================================= */

// POST /api/auth/vets/register (Register New Vet / Doctor with all fields)
router.post("/vets/register", async function (req, res) {
  try {
    const body = req.body || {};
    const name = body.name || body.fullName;
    const email = body.email;
    const vciNumber = body.vciNumber || body.regNumber || body.licenseNumber;
    const password = body.password;

    if (!name || !email || !vciNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide Name, Email, VCI Registration Number, and Password."
      });
    }

    const normEmail = String(email).toLowerCase().trim();
    const normVci = String(vciNumber).toUpperCase().trim();

    const vetData = {
      name: name,
      email: normEmail,
      vciNumber: normVci,
      password: password,
      phone: body.phone || "+91 98765 43210",
      qualification: body.qualification || "B.V.Sc & A.H.",
      university: body.university || "Veterinary College",
      experienceYears: Number(body.experienceYears || body.experience) || 5,
      specialization: Array.isArray(body.specialization) ? body.specialization : (body.specialization ? [body.specialization] : ["General Practice"]),
      clinicName: body.clinicName || "PawsCare Pet Hospital",
      city: body.city || "Bengaluru",
      clinicAddress: body.clinicAddress || (body.clinicName ? body.clinicName + ", " : "") + (body.city || "Bengaluru"),
      consultationFee: Number(body.consultationFee || body.consultFee || body.fee) || 499,
      clinicPhone: body.clinicPhone || "080-25501234",
      about: body.about || "Dedicated veterinarian registered with VCI.",
      photoUrl: body.photoUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop",
      licenseCertUrl: body.licenseCertUrl || "",
      isVerified: true,
      status: "active",
      role: "doctor"
    };

    // Check existing
    const existingDbVet = await Vet.findOne({
        $or: [{ email: normEmail }, { vciNumber: normVci }]
    });

    if (existingDbVet) {
      return res.status(400).json({
        success: false,
        message: "A veterinarian with this email or VCI License number already exists."
      });
    }

    const newDbVet = new Vet(vetData);
    await newDbVet.save();

    const safeVet = newDbVet.toObject();
    delete safeVet.password;

    return res.status(201).json({
      success: true,
      message: "Veterinarian Registered Successfully!",
      token: "vet_token_" + Date.now(),
      vet: safeVet
    });
  } catch (error) {
    console.error("Vet Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during vet registration: " + error.message
    });
  }
});

// POST /api/auth/vets/login (Dedicated Doctor Login Endpoint)
router.post("/vets/login", function (req, res) {
  const identifier = req.body.email || req.body.vciNumber || req.body.identifier;
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter Email/VCI Registration Number and Password."
    });
  }

  return handleVetLogin(req, res, identifier, password);
});

// GET /api/auth/vets (List all registered Veterinarians)
router.get("/vets", async function (req, res) {
  try {
    const dbVets = await Vet.find().sort({ createdAt: -1 });
    
    const safeVets = dbVets.map(v => {
      const vCopy = v.toObject();
      delete vCopy.password;
      return vCopy;
    });

    return res.json({ success: true, count: safeVets.length, data: safeVets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/users (List all registered Users)
router.get("/users", async function (req, res) {
  try {
    const dbUsers = await User.find().sort({ createdAt: -1 });

    const safeUsers = dbUsers.map(u => {
      const uCopy = u.toObject();
      delete uCopy.password;
      return uCopy;
    });

    return res.json({ success: true, count: safeUsers.length, data: safeUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Vet = require("../models/Vet");
const Consultation = require("../models/Consultation");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");

// Middleware: Verify Doctor Authorization
function verifyDoctorAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim() || req.query.token;

  if (!token || !token.startsWith("vet_token_")) {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Doctor authorization token required."
    });
  }

  next();
}

/* =========================================================
   VETERINARIAN DATABASE COLLECTION API ENDPOINTS ('vets')
   ========================================================= */

// GET /api/vets - Retrieve all registered veterinarians
router.get("/", async function (req, res) {
  try {
    let query = {};
    if (req.query.city) {
      query.city = new RegExp(req.query.city, 'i');
    }
    
    if (req.query.specialization) {
      query.specialization = req.query.specialization; // Match if array contains it
    }

    const dbVets = await Vet.find(query).sort({ createdAt: -1 });

    const safeVets = dbVets.map(v => {
      const vCopy = v.toObject();
      delete vCopy.password;
      return vCopy;
    });

    return res.json({
      success: true,
      count: safeVets.length,
      collection: "vets",
      data: safeVets
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/vets/me - Authenticated Doctor Profile Self Check
router.get("/me", verifyDoctorAuth, async function (req, res) {
  return res.status(404).json({ success: false, message: "Use /api/vets/:id instead." });
});

// GET /api/vets/:id - Single Doctor Details
router.get("/:id", async function (req, res) {
  try {
    const idParam = req.params.id;
    
    let query = { $or: [{ vciNumber: new RegExp('^' + idParam + '$', 'i') }] };
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        query.$or.unshift({ _id: idParam });
    }

    const dbVet = await Vet.findOne(query);

    if (!dbVet) {
      return res.status(404).json({ success: false, message: "Veterinarian record not found." });
    }

    const safeVet = dbVet.toObject();
    delete safeVet.password;
    return res.json({ success: true, data: safeVet });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/vets/:id - Update Doctor Profile
router.put("/:id", async function (req, res) {
  try {
    const idParam = req.params.id;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(idParam)) {
        return res.status(404).json({ success: false, message: "Invalid Vet ID format." });
    }

    const updatedVet = await Vet.findByIdAndUpdate(
        idParam,
        { $set: updateData },
        { new: true }
    );

    if (!updatedVet) {
       return res.status(404).json({ success: false, message: "Vet not found." });
    }
    
    const safeVet = updatedVet.toObject();
    delete safeVet.password;
    return res.json({ success: true, vet: safeVet });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   SCOPED DOCTOR DATA ISOLATION API ENDPOINTS
   ========================================================= */

// GET /api/vets/:id/dashboard - Scoped Dashboard Metrics
router.get("/:id/dashboard", verifyDoctorAuth, async function (req, res) {
  try {
    const idParam = req.params.id;
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    const allConsults = await Consultation.find({ vetId: idParam }).sort({ createdAt: -1 });

    const todaysConsultations = allConsults.filter(c => c.date === todayStr);
    const completed = allConsults.filter(c => c.status === 'completed');
    
    return res.json({
      success: true,
      doctorId: idParam,
      metrics: {
        todaysConsultations: todaysConsultations.length,
        totalAppointments: completed.length,
        monthlyEarnings: completed.reduce((sum, c) => sum + (c.fee || 499), 0),
        pendingPayout: 0
      },
      appointments: allConsults
    });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vets/:id/appointments - Scoped Appointment List
router.get("/:id/appointments", verifyDoctorAuth, async function (req, res) {
  try {
    const idParam = req.params.id;
    const dbAppointments = await Appointment.find({ vetId: idParam }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      doctorId: idParam,
      count: dbAppointments.length,
      appointments: dbAppointments
    });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vets/:id/appointments - Create Appointment
router.post("/:id/appointments", async function (req, res) {
  try {
    const idParam = req.params.id;
    const body = req.body;
    body.vetId = idParam;
    
    const newAppt = new Appointment(body);
    await newAppt.save();
    
    return res.status(201).json({ success: true, appointment: newAppt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vets/:id/availability - Scoped Availability Schedule
router.get("/:id/availability", verifyDoctorAuth, function (req, res) {
  return res.json({
    success: true,
    doctorId: req.params.id,
    availability: {
      weeklyHours: { "Monday": "09:00 AM - 05:00 PM", "Tuesday": "09:00 AM - 05:00 PM", "Wednesday": "09:00 AM - 05:00 PM", "Thursday": "09:00 AM - 05:00 PM", "Friday": "09:00 AM - 05:00 PM", "Saturday": "Closed", "Sunday": "Closed" },
      slotDuration: 30,
      emergencyConsult: true
    }
  });
});

// PUT /api/vets/:id/availability - Update Scoped Availability
router.put("/:id/availability", verifyDoctorAuth, async function (req, res) {
  return res.json({
    success: true,
    message: "Doctor availability schedule updated successfully!",
    availability: req.body.weeklyHours || []
  });
});

// POST /api/vets/:id/prescriptions - Create Digital Prescription
router.post("/:id/prescriptions", verifyDoctorAuth, async function (req, res) {
  try {
    const idParam = req.params.id;
    const body = req.body;
    body.vetId = idParam;
    
    const newPrescription = new Prescription(body);
    await newPrescription.save();
    
    return res.status(201).json({
      success: true,
      message: "Prescription issued successfully",
      prescription: newPrescription
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vets/:id/prescriptions - Get Prescriptions
router.get("/:id/prescriptions", verifyDoctorAuth, async function (req, res) {
  try {
    const idParam = req.params.id;
    
    const dbPrescriptions = await Prescription.find({ vetId: idParam }).sort({ createdAt: -1 });

    return res.json({ success: true, prescriptions: dbPrescriptions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vets/:id/earnings - Scoped Financial & Earnings Data
router.get("/:id/earnings", verifyDoctorAuth, async function (req, res) {
  try {
    const idParam = req.params.id;
    
    const allAppts = await Appointment.find({ vetId: idParam, status: 'completed' });

    const totalEarnings = allAppts.reduce((sum, c) => sum + (Number(c.fee) || 499), 0);
    const todayStr = new Date().toISOString().split("T")[0].substring(0, 7); // YYYY-MM
    const thisMonthAppts = allAppts.filter(c => c.date && c.date.startsWith(todayStr));
    const thisMonthEarnings = thisMonthAppts.reduce((sum, c) => sum + (Number(c.fee) || 499), 0);

    return res.json({
      success: true,
      doctorId: idParam,
      earnings: {
        thisMonth: thisMonthEarnings,
        totalConsultations: allAppts.length,
        pendingPayout: totalEarnings > 1000 ? 1000 : totalEarnings, // Mock pending payout
        history: []
      }
    });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vets/register - Register New Veterinarian Document
router.post("/register", async function (req, res) {
  try {
    const body = req.body || {};
    const name = body.name || body.fullName;
    const email = body.email;
    const vciNumber = body.vciNumber || body.regNumber || body.licenseNumber;
    const password = body.password;

    if (!name || !email || !vciNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide Full Name, Email, VCI Registration Number, and Password."
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

    const respVet = newDbVet.toObject();
    delete respVet.password;

    return res.status(201).json({
      success: true,
      message: "Doctor Registered Successfully!",
      token: "vet_token_" + newDbVet._id,
      vet: respVet,
      user: respVet
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during vet registration: " + error.message
    });
  }
});

// POST /api/vets/login - Doctor Login via Email or VCI Registration Number
router.post("/login", async function (req, res) {
  try {
    const identifier = req.body.email || req.body.vciNumber || req.body.identifier;
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter Email/VCI Registration Number and Password."
      });
    }

    const queryStr = String(identifier).trim();
    const queryRegex = new RegExp('^' + queryStr + '$', 'i');

    const dbVet = await Vet.findOne({
        $or: [{ email: queryRegex }, { vciNumber: queryRegex }]
    });

    if (!dbVet || dbVet.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email/VCI Registration Number or Password."
      });
    }

    const safeVet = dbVet.toObject();
    delete safeVet.password;

    return res.json({
      success: true,
      message: "Doctor Login Successful!",
      token: "vet_token_" + dbVet._id,
      vet: safeVet,
      user: safeVet
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

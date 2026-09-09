const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");

// GET /api/prescriptions
router.get("/", async function (req, res) {
  try {
    const vetId = req.query.vetId;
    const ownerId = req.query.ownerId; 

    let query = {};
    if (vetId) {
      query.vetId = vetId;
    }
    
    let dbPrescriptions = await Prescription.find(query).sort({ createdAt: -1 });

    if (ownerId) {
       const appts = await Appointment.find({ ownerId }).select('_id');
       const apptIds = appts.map(a => a._id.toString());
       
       dbPrescriptions = dbPrescriptions.filter(p => apptIds.includes(p.appointmentId));
    }
    
    return res.json({ success: true, data: dbPrescriptions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/prescriptions/:id
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Prescription ID format." });
    }

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found." });
    }
    return res.json({ success: true, data: prescription });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/prescriptions
router.post("/", async function (req, res) {
  try {
    const body = req.body;
    
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

module.exports = router;

const express = require("express");
const router = express.Router();
const Consultation = require("../models/Consultation");
const mongoose = require("mongoose");

// GET /api/consultations
// Supports filtering by vetId or ownerId
router.get("/", async function (req, res) {
  try {
    const vetId = req.query.vetId;
    const ownerId = req.query.ownerId;
    
    let query = {};
    if (vetId) query.vetId = vetId;
    if (ownerId) query.ownerId = ownerId;

    const consultations = await Consultation.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/consultations/metrics
router.get("/metrics", async function (req, res) {
  try {
    const vetId = req.query.vetId;
    if (!vetId) {
      return res.status(400).json({ success: false, message: "vetId is required" });
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    
    const allConsults = await Consultation.find({ vetId });

    const metrics = {
      totalConsultations: allConsults.length,
      completedConsultations: allConsults.filter(c => c.status === 'completed').length,
      upcomingConsultations: allConsults.filter(c => c.status === 'upcoming').length,
      todayConsultations: allConsults.filter(c => c.date === todayStr).length,
      totalEarnings: allConsults.filter(c => c.status === 'completed').reduce((sum, c) => sum + (Number(c.fee) || 499), 0),
      rating: 4.8 // Default or mocked for now
    };
    
    return res.json({ success: true, data: metrics });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/consultations/:id
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    // Check if id is a valid ObjectId, otherwise query by appointmentId
    let query = { $or: [{ appointmentId: id }] };
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or.unshift({ _id: id });
    }

    const consultation = await Consultation.findOne(query);

    if (!consultation) {
      return res.status(404).json({ success: false, message: "Consultation not found." });
    }
    
    return res.json({ success: true, data: consultation });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/consultations
router.post("/", async function (req, res) {
  try {
    const body = req.body;
    
    const newConsultation = new Consultation(body);
    await newConsultation.save();
    
    return res.status(201).json({ success: true, data: newConsultation });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/consultations/:id/notes
router.put("/:id/notes", async function (req, res) {
  try {
    const { id } = req.params;
    const { clinicalNotes } = req.body;
    
    let query = { $or: [{ appointmentId: id }] };
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or.unshift({ _id: id });
    }

    const updatedConsultation = await Consultation.findOneAndUpdate(
        query,
        { $set: { clinicalNotes } },
        { new: true }
    );

    if (!updatedConsultation) {
       return res.status(404).json({ success: false, message: "Consultation not found." });
    }
    
    return res.json({ success: true, data: updatedConsultation });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/consultations/:id/status
router.put("/:id/status", async function (req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    let query = { $or: [{ appointmentId: id }] };
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or.unshift({ _id: id });
    }

    const updatedConsultation = await Consultation.findOneAndUpdate(
        query,
        { $set: { status } },
        { new: true }
    );

    if (!updatedConsultation) {
       return res.status(404).json({ success: false, message: "Consultation not found." });
    }
    
    return res.json({ success: true, data: updatedConsultation });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/consultations/:id
router.delete("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    
    let query = { $or: [{ appointmentId: id }] };
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or.unshift({ _id: id });
    }

    const deletedConsultation = await Consultation.findOneAndDelete(query);

    if (!deletedConsultation) {
       return res.status(404).json({ success: false, message: "Consultation not found." });
    }
    
    return res.json({ success: true, message: "Consultation deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

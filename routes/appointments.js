const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Consultation = require("../models/Consultation");
const supabase = require("../config/supabase");

// GET /api/appointments
router.get("/", async function (req, res) {
  try {
    const vetId = req.query.vetId;
    const ownerId = req.query.ownerId;
    
    let query = {};
    if (vetId) query.vetId = vetId;
    if (ownerId) query.ownerId = ownerId;

    const appointments = await Appointment.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: appointments.length,
      appointments: appointments
    });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/appointments
router.post("/", async function (req, res) {
  try {
    const body = req.body;
    
    const newAppt = new Appointment(body);
    await newAppt.save();
    
    // Also create the related Consultation record (mirroring the behavior)
    const newConsultation = new Consultation({
      vetId: newAppt.vetId,
      vetName: newAppt.vetName,
      appointmentId: newAppt._id.toString(),
      petId: newAppt.petId,
      ownerId: newAppt.ownerId,
      ownerName: newAppt.ownerName,
      petName: newAppt.petName,
      date: newAppt.date,
      time: newAppt.time,
      consultationType: newAppt.consultationType,
      status: newAppt.status,
      petSpecies: newAppt.petSpecies,
      petWeight: newAppt.petWeight,
      reasonForVisit: newAppt.reason
    });
    
    await newConsultation.save();
    
    // Send Realtime notification via Supabase
    try {
        await supabase
          .from('chat_messages')
          .insert([{
            conversationId: newConsultation._id.toString(),
            senderId: 'system',
            senderRole: 'system',
            receiverId: newAppt.vetId.toString(),
            message: `New consultation request from ${newAppt.ownerName} for ${newAppt.petName} on ${newAppt.date} at ${newAppt.time}.`,
            messageType: 'notification'
          }]);
    } catch (err) {
        console.error("Failed to send Supabase notification", err);
    }

    return res.status(201).json({ success: true, appointment: newAppt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/appointments/:id/status
router.put("/:id/status", async function (req, res) {
  try {
    const { id } = req.params;
    const { status, meetLink } = req.body;
    
    const updateData = { status };
    if (meetLink !== undefined) {
      updateData.meetLink = meetLink;
    }
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    );

    if (!updatedAppointment) {
       return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Also update the related Consultation if it exists
    await Consultation.findOneAndUpdate(
        { appointmentId: id },
        { $set: updateData }
    );

    return res.json({ success: true, appointment: updatedAppointment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');


const appointmentSchema = new mongoose.Schema({
    vetId: { type: String, required: true }, // Changed to String to prevent CastError from memory IDs
    vetName: { type: String }, // Added vetName
    petId: { type: String },
    ownerId: { type: String },
    ownerName: { type: String, required: true },
    petName: { type: String, required: true },
    petSpecies: { type: String },
    petWeight: { type: String },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "10:00 AM"
    duration: { type: String, default: "30 Min Telehealth" },
    reason: { type: String, required: true },
    consultationType: { type: String, default: "Virtual Telehealth Call" },
    status: { type: String, enum: ['pending', 'upcoming', 'today', 'urgent', 'completed', 'cancelled'], default: 'pending' },
    meetLink: { type: String },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

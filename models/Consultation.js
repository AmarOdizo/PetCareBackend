const mongoose = require('mongoose');


const consultationSchema = new mongoose.Schema({
    vetId: { type: String, required: true }, // Changed to String to prevent CastError
    vetName: { type: String }, 
    appointmentId: { type: String },
    petId: { type: String },
    ownerId: { type: String }, 
    ownerName: { type: String, required: true },
    petName: { type: String, required: true },
    date: { type: String, required: true }, // e.g., "YYYY-MM-DD"
    time: { type: String, required: true }, // e.g., "10:00 AM"
    consultationType: { type: String, default: "Virtual Telehealth Call" },
    fee: { type: Number, default: 499 },
    status: { type: String, enum: ['pending', 'upcoming', 'completed', 'cancelled'], default: 'pending' },
    meetLink: { type: String },
    
    // Clinical & Live Chat Details
    vetSpecialization: { type: String },
    petSpecies: { type: String },
    petBreed: { type: String },
    petAge: { type: String },
    petWeight: { type: String },
    petSex: { type: String },
    ownerPhone: { type: String },
    reasonForVisit: { type: String },
    clinicalNotes: {
        symptoms: [{ type: String }],
        tentativeDiagnosis: { type: String },
        notes: { type: String },
        prescriptionPlan: [{
            item: { type: String },
            dosage: { type: String }
        }]
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);

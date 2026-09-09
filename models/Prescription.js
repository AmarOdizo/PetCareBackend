const mongoose = require('mongoose');


const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String }
});

const prescriptionSchema = new mongoose.Schema({
    vetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vet', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    ownerId: { type: String }, // Storing ownerId directly for easier frontend filtering
    
    // Immutable Vet Details
    vetName: { type: String },
    vetQualification: { type: String },
    vetSpecialization: { type: String },
    vetClinic: { type: String },
    vetPhone: { type: String },
    vetImage: { type: String },
    vetSignature: { type: String },
    
    patientName: { type: String, required: true },
    speciesBreed: { type: String },
    ageWeight: { type: String },
    petParent: { type: String },
    symptoms: { type: String },
    diagnosis: { type: String, required: true },
    medications: [medicationSchema],
    date: { type: String }, // "September 02, 2026"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

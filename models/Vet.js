let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  mongoose = null;
}

let Vet = null;

if (mongoose) {
  try {
    const VetSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: [true, "Veterinarian name is required"],
          trim: true
        },
        email: {
          type: String,
          required: [true, "Email is required"],
          unique: true,
          lowercase: true,
          trim: true
        },
        vciNumber: {
          type: String,
          required: [true, "VCI Registration Number is required"],
          unique: true,
          uppercase: true,
          trim: true
        },
        password: {
          type: String,
          required: [true, "Password is required"]
        },
        phone: {
          type: String,
          default: "+91 98765 43210"
        },
        qualification: {
          type: String,
          default: "B.V.Sc & A.H."
        },
        university: {
          type: String,
          default: "KVAFSU Bangalore"
        },
        experienceYears: {
          type: Number,
          default: 5
        },
        specialization: {
          type: [String],
          default: ["General Veterinary Practice"]
        },
        clinicName: {
          type: String,
          default: "PawsCare Pet Hospital"
        },
        city: {
          type: String,
          default: "Koramangala, Bengaluru"
        },
        clinicAddress: {
          type: String,
          default: "Koramangala 4th Block, Bengaluru, Karnataka"
        },
        consultationFee: {
          type: Number,
          default: 499
        },
        clinicPhone: {
          type: String,
          default: "080-25501234"
        },
        about: {
          type: String,
          default: "Experienced veterinarian providing comprehensive pet healthcare, diagnostics, and telehealth support."
        },
        photoUrl: {
          type: String,
          default: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop"
        },
        licenseCertUrl: {
          type: String,
          default: ""
        },
        isVerified: {
          type: Boolean,
          default: true
        },
        status: {
          type: String,
          enum: ["active", "pending", "suspended"],
          default: "active"
        },
        role: {
          type: String,
          default: "doctor"
        },
        emergencyDuty: {
          type: Boolean,
          default: true
        },
        telehealthMode: {
          type: Boolean,
          default: true
        },
        availability: {
          type: [{
            day: String,
            active: Boolean,
            slots: [String]
          }],
          default: [
            { day: "Monday", active: true, slots: ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM"] },
            { day: "Tuesday", active: true, slots: ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM"] },
            { day: "Wednesday", active: false, slots: [] },
            { day: "Thursday", active: true, slots: ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM"] },
            { day: "Friday", active: true, slots: ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM"] },
            { day: "Saturday", active: true, slots: ["10:00 AM", "11:30 AM"] },
            { day: "Sunday", active: false, slots: [] }
          ]
        }
      },
      {
        timestamps: true
      }
    );

    Vet = mongoose.models.Vet || mongoose.model('Vet', VetSchema);
  } catch (e) {
    Vet = null;
  }
}

module.exports = Vet;

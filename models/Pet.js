let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  mongoose = null;
}

let Pet = null;

if (mongoose) {
  try {
    const PetSchema = new mongoose.Schema(
      {
        name: { type: String, required: [true, "Pet name is required"], trim: true },
        species: { type: String, required: [true, "Pet species is required"] },
        breed: { type: String, default: "Mixed" },
        gender: { type: String, enum: ["Male", "Female"], default: "Male" },
        age: { type: Number, default: 1 },
        ageUnit: { type: String, enum: ["Years", "Months"], default: "Years" },
        color: { type: String, default: "" },
        weight: { type: Number, default: 5 },
        weightUnit: { type: String, enum: ["kg", "lb"], default: "kg" },
        image: { type: String, default: "" },
        description: { type: String, default: "" },
        vaccinated: { type: Boolean, default: true },
        vaccinationDate: { type: Date, default: Date.now },
        healthStatus: { type: String, enum: ["Healthy", "Sick", "Under Treatment"], default: "Healthy" },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ownerName: { type: String, default: "Jane Doe" },
        ownerPhone: { type: String, default: "(555) 123-4567" },
        ownerEmail: { type: String, default: "owner@example.com" },
        address: { type: String, default: "123 Pet Street, Animalville" },
        status: { type: String, enum: ["Available", "Adopted", "Sold", "Inactive"], default: "Available" }
      },
      {
        timestamps: true
      }
    );

    Pet = mongoose.models.Pet || mongoose.model('Pet', PetSchema);
  } catch (e) {
    Pet = null;
  }
}

module.exports = Pet;

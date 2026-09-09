const express = require("express");
const router = express.Router();
const Pet = require("../models/Pet");
const mongoose = require("mongoose");

// Middleware: Verify Owner Authorization
function verifyOwnerAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim() || req.query.token;

  if (!token || token.startsWith("vet_token_")) {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Owner authorization token required."
    });
  }
  next();
}

// GET /api/pets - Get all pets from 'pets' collection table
router.get("/", async function (req, res) {
  try {
    let query = {};
    if (req.query.type) {
      query.species = new RegExp(req.query.type, 'i');
    }
    if (req.query.ownerEmail) query.ownerEmail = req.query.ownerEmail;
    if (req.query.ownerPhone) query.ownerPhone = req.query.ownerPhone;
    if (req.query.status) query.status = req.query.status;
    if (req.query.ownerId) query.ownerId = req.query.ownerId;

    const dbPets = await Pet.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: dbPets.length,
      collection: "pets",
      data: dbPets
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/pets/:id - Get single pet by ID
router.get("/:id", async function (req, res) {
  try {
    const idParam = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(idParam)) {
        return res.status(404).json({ success: false, message: "Invalid Pet ID format." });
    }

    const dbPet = await Pet.findById(idParam);

    if (dbPet) return res.json({ success: true, data: dbPet });
    
    return res.status(404).json({ success: false, message: "Pet record not found." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/pets - Register new pet
router.post("/", verifyOwnerAuth, async function (req, res) {
  try {
    const body = req.body || {};
    if (!body.name || (!body.species && !body.type)) {
      return res.status(400).json({ success: false, message: "Pet Name and Species (Dog/Cat/Bird etc.) are required." });
    }

    const newPetData = {
      name: body.name,
      species: body.species || body.type,
      breed: body.breed || "Mixed",
      gender: body.gender || "Male",
      age: body.age !== undefined ? Number(body.age) : 1,
      ageUnit: body.ageUnit || "Years",
      weight: body.weight !== undefined ? Number(body.weight) : 5,
      weightUnit: body.weightUnit || "kg",
      color: body.color || "",
      image: body.image || "",
      description: body.description || "",
      vaccinated: body.vaccinated !== undefined ? Boolean(body.vaccinated) : true,
      vaccinationDate: body.vaccinationDate || new Date(),
      healthStatus: body.healthStatus || "Healthy",
      ownerId: body.ownerId || "",
      ownerName: body.ownerName || "",
      ownerPhone: body.ownerPhone || "",
      ownerEmail: body.ownerEmail || "",
      address: body.address || "",
      status: body.status || "Available"
    };

    const newPet = new Pet(newPetData);
    await newPet.save();

    return res.status(201).json({
      success: true,
      message: "Pet Registered Successfully!",
      data: newPet
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/pets/:id - Update pet record
router.put("/:id", verifyOwnerAuth, async function (req, res) {
  try {
    const idParam = req.params.id;
    const body = req.body || {};
    
    if (!mongoose.Types.ObjectId.isValid(idParam)) {
        return res.status(404).json({ success: false, message: "Invalid Pet ID format." });
    }

    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.species !== undefined || body.type !== undefined) updateData.species = body.species || body.type;
    if (body.breed !== undefined) updateData.breed = body.breed;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.age !== undefined) updateData.age = Number(body.age);
    if (body.ageUnit !== undefined) updateData.ageUnit = body.ageUnit;
    if (body.weight !== undefined) updateData.weight = Number(body.weight);
    if (body.weightUnit !== undefined) updateData.weightUnit = body.weightUnit;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.vaccinated !== undefined) updateData.vaccinated = Boolean(body.vaccinated);
    if (body.vaccinationDate !== undefined) updateData.vaccinationDate = body.vaccinationDate;
    if (body.healthStatus !== undefined) updateData.healthStatus = body.healthStatus;
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
    if (body.ownerPhone !== undefined) updateData.ownerPhone = body.ownerPhone;
    if (body.ownerEmail !== undefined) updateData.ownerEmail = body.ownerEmail;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.status !== undefined) updateData.status = body.status;

    const updatedPet = await Pet.findByIdAndUpdate(
        idParam,
        { $set: updateData },
        { new: true }
    );

    if (updatedPet) return res.json({ success: true, message: "Pet updated successfully!", data: updatedPet });
    return res.status(404).json({ success: false, message: "Pet record not found." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/pets/:id - Delete pet record
router.delete("/:id", verifyOwnerAuth, async function (req, res) {
  try {
    const idParam = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(idParam)) {
        return res.status(404).json({ success: false, message: "Invalid Pet ID format." });
    }

    const deletedPet = await Pet.findByIdAndDelete(idParam);

    if (deletedPet) return res.json({ success: true, message: "Pet deleted!" });
    return res.status(404).json({ success: false, message: "Pet record not found." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

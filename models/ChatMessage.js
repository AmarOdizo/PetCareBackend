const mongoose = require('mongoose');


const chatMessageSchema = new mongoose.Schema({
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: false }, // added per request
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['vet', 'owner'], required: true },
    message: { type: String, required: true },
    attachmentName: { type: String }, // e.g. 'luna_photo.jpg'
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

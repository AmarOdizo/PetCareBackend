const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// GET /api/chat
// For debugging purposes
router.get("/", async function (req, res) {
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    return res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/chat/:consultationId
router.get("/:consultationId", async function (req, res) {
  try {
    const { consultationId } = req.params;
    
    const { data: consultation, error: consultErr } = await supabase
      .from('consultations')
      .select('*')
      .or(`_id.eq.${consultationId},appointmentId.eq.${consultationId}`)
      .maybeSingle();

    if (consultErr) throw consultErr;

    if (!consultation) {
       return res.status(404).json({ success: false, message: "Consultation not found" });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('consultationId', consultation._id)
      .order('createdAt', { ascending: true });

    if (error) throw error;

    return res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/chat/seed
router.get("/seed/test", async function(req, res) {
  return res.json({ success: false, message: "Seed disabled for Supabase mode." });
});

// POST /api/chat/:consultationId
router.post("/:consultationId", async function (req, res) {
  try {
    const { consultationId } = req.params;
    let body = { ...req.body, consultationId };

    const { data: consultation, error: consultErr } = await supabase
      .from('consultations')
      .select('*')
      .or(`_id.eq.${consultationId},appointmentId.eq.${consultationId}`)
      .maybeSingle();

    if (consultation) {
      body.consultationId = consultation._id;
      if (body.senderRole === 'vet') {
        body.receiverId = consultation.ownerId;
      } else if (body.senderRole === 'owner') {
        body.receiverId = consultation.vetId;
      }
    }
    
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    
    return res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// GET /api/favorites?ownerId=...
router.get("/", async (req, res) => {
  try {
    const ownerId = req.query.ownerId;
    if (!ownerId) {
      return res.status(400).json({ success: false, message: "ownerId query parameter is required" });
    }

    const { data: favorites, error } = await supabase
      .from('favorite_vets')
      .select('*')
      .eq('ownerId', ownerId);

    if (error) throw error;
    
    return res.json({ success: true, data: favorites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/favorites
router.post("/", async (req, res) => {
  try {
    const { ownerId, vetId } = req.body;
    if (!ownerId || !vetId) {
      return res.status(400).json({ success: false, message: "ownerId and vetId are required" });
    }

    // Check if exists
    const { data: existing, error: findError } = await supabase
      .from('favorite_vets')
      .select('*')
      .eq('ownerId', ownerId)
      .eq('vetId', vetId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      return res.status(201).json({ success: true, data: existing });
    }

    const { data: favorite, error } = await supabase
      .from('favorite_vets')
      .insert([{ ownerId, vetId }])
      .select()
      .single();

    if (error) throw error;
    
    return res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/favorites
router.delete("/", async (req, res) => {
  try {
    const { ownerId, vetId } = req.body;
    if (!ownerId || !vetId) {
      return res.status(400).json({ success: false, message: "ownerId and vetId are required" });
    }

    const { error } = await supabase
      .from('favorite_vets')
      .delete()
      .eq('ownerId', ownerId)
      .eq('vetId', vetId);

    if (error) throw error;
    
    return res.json({ success: true, message: "Favorite removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

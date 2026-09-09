const express = require("express");
const router = express.Router();

// In-memory data store for fallback
let items = [
  { id: "1", name: "Sample Item 1", description: "Demo item for testing backend API", createdAt: new Date().toISOString() },
  { id: "2", name: "Sample Item 2", description: "Another demo item", createdAt: new Date().toISOString() }
];

// Health Check Endpoint
router.get("/health", function (req, res) {
  res.json({
    success: true,
    message: "API backend is running successfully",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// System Status Endpoint
router.get("/status", function (req, res) {
  res.json({
    success: true,
    server: "Node.js Express Backend (Supabase Mode)",
    port: process.env.PORT || 5000,
    databaseConnected: true,
    mode: "Supabase Connected",
    timestamp: new Date().toISOString()
  });
});

// GET all items
router.get("/items", function (req, res) {
  res.json({
    success: true,
    count: items.length,
    data: items
  });
});

// GET single item
router.get("/items/:id", function (req, res) {
  const item = items.find(function (i) { return i.id === req.params.id; });
  if (!item) {
    return res.status(404).json({ success: false, message: "Item not found" });
  }
  res.json({ success: true, data: item });
});

// POST create item
router.post("/items", function (req, res) {
  const name = req.body && req.body.name ? req.body.name : ("Item " + (items.length + 1));
  const description = req.body && req.body.description ? req.body.description : "No description provided";
  
  const newItem = {
    id: String(Date.now()),
    name: name,
    description: description,
    createdAt: new Date().toISOString()
  };
  
  items.push(newItem);
  res.status(201).json({
    success: true,
    message: "Item created successfully",
    data: newItem
  });
});

// DELETE item
router.delete("/items/:id", function (req, res) {
  const initialLength = items.length;
  items = items.filter(function (i) { return i.id !== req.params.id; });
  
  if (items.length === initialLength) {
    return res.status(404).json({ success: false, message: "Item not found" });
  }
  
  res.json({ success: true, message: "Item deleted successfully" });
});

// GET /seed
router.get("/seed", async function(req, res) {
  res.json({ success: false, message: "Seed disabled for Supabase mode." });
});

module.exports = router;

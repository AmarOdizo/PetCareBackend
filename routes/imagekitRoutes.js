const express = require("express");
const router = express.Router();
const imagekit = require("../config/imagekit");

// GET /api/imagekit/auth - Get client-side ImageKit upload authentication signature
router.get("/auth", function (req, res) {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    return res.json({
      success: true,
      message: "ImageKit auth signature generated successfully",
      data: authParams
    });
  } catch (error) {
    console.error("GET /api/imagekit/auth Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/imagekit/upload - Upload base64 or remote URL image to ImageKit
router.post("/upload", function (req, res) {
  try {
    const body = req.body || {};
    const file = body.file || body.image || body.fileData;
    const fileName = body.fileName || body.name || "pet_image_" + Date.now() + ".jpg";
    const folder = body.folder || "/pets";

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Missing image file or base64 data URL in request body."
      });
    }

    return imagekit.uploadImage(file, fileName, folder).then(function (result) {
      return res.status(200).json({
        success: true,
        message: "Image uploaded to ImageKit successfully!",
        url: result.url,
        fileId: result.fileId,
        data: result
      });
    }).catch(function (error) {
      console.error("POST /api/imagekit/upload Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload image to ImageKit"
      });
    });
  } catch (error) {
    console.error("POST /api/imagekit/upload Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image to ImageKit"
    });
  }
});

// POST /api/imagekit/delete - Delete image from ImageKit
router.post("/delete", function (req, res) {
  try {
    const fileId = req.body.fileId || req.body.id;
    if (!fileId) {
      return res.status(400).json({ success: false, message: "Missing fileId parameter." });
    }

    return imagekit.deleteImage(fileId).then(function (result) {
      return res.json({
        success: true,
        message: "Image deleted from ImageKit successfully",
        data: result
      });
    }).catch(function (error) {
      console.error("POST /api/imagekit/delete Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    });
  } catch (error) {
    console.error("POST /api/imagekit/delete Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

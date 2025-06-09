const express = require("express");
const Image = require("../../models/Image");
const router = express.Router();

router.post("/image", async (req, res) => {
  try {
    const { batchId = null, imageUrl, views = {} } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const newImage = new Image({
      batchId,
      imageUrl,
      status: "completed",
      views: {
        full: views.full || null,
        neck: views.neck || null,
        sleeve: views.sleeve || null,
        waist: views.waist || null,
        length: views.length || null,
        zoomed: views.zoomed || null,
      },
    });

    await newImage.save();

    res.status(201).json({
      message: "Image and views saved successfully",
      image: newImage,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/images', async (req, res) => {
  try {
    const images = await Image.find({ batchId: null }).sort({ _id: -1 });
    res.json(images);
  } catch (err) {
    console.error('Error fetching unbatched images:', err);
    res.status(500).json({ error: 'Failed to fetch unbatched images' });
  }
});

module.exports = router;

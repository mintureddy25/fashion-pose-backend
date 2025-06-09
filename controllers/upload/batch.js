const express = require("express");
const Image = require("../../models/Image");
const Batch = require("../../models/Batch");
const router = express.Router();
const RabbitMQService = require("../../services/rabbitMQ");


router.post("/batch", async (req, res) => {
  const { imageUrls } = req.body;

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: "imageUrls must be a non-empty array" });
  }

  try {

    const batch = await Batch.create({
      totalImages: imageUrls.length,
      processedImages: 0,
      status: "pending",
    });

    const imageDocs = imageUrls.map((url) => ({
      imageUrl: url,
      batchId: batch._id,
      status: "pending",
    }));

    const insertedImages = await Image.insertMany(imageDocs);

    
    for (const img of insertedImages) {
      await RabbitMQService.sendToQueue({
        imageId: img._id,
        imageUrl: img.imageUrl,
      });
    }

    res.status(201).json({
      message: "Batch created and images queued for processing.",
      batchId: batch._id,
      imageCount: insertedImages.length,
    });
  } catch (err) {
    console.error("Batch upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find().sort({ _id: -1 }).populate('images');
    res.json(batches);
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});


module.exports = router;

const { loadImage } = require("canvas");
const Image = require("../models/Image");
const { generateViews } = require("../utils/poseUtils");
const { uploadToS3 } = require("../utils/s3Utils");
const Batch = require("../models/Batch");

const processImage = async (imageId, imageUrl) => {
  try {
    await Image.findByIdAndUpdate(imageId, { status: "processing" });

    const img = await loadImage(imageUrl);
    const views = await generateViews(img);

    const uploadedViews = {};
    for (const [viewName, buffer] of Object.entries(views)) {
      const key = `processed/${imageId}-${viewName}.png`;
      const url = await uploadToS3(buffer, key);
      uploadedViews[viewName] = url;
    }

    const updatedImage = await Image.findByIdAndUpdate(
      imageId,
      {
        status: "completed",
        views: uploadedViews,
      },
      { new: true }
    );

    // Handle batch progress
    if (updatedImage.batchId) {
      const batch = await Batch.findByIdAndUpdate(
        updatedImage.batchId,
        { $inc: { processedImages: 1 } },
        { new: true }
      );

      if (batch && batch.processedImages + 1 >= batch.totalImages) {
        await Batch.findByIdAndUpdate(updatedImage.batchId, {
          status: "completed",
        });
      }
    }

    console.log(`Processed and updated image ${imageId}`);
  } catch (err) {
    console.error(`Error processing image ${imageId}:`, err.message);
    await Image.findByIdAndUpdate(imageId, {
      status: "failed",
      error: err.message,
    });
    // // Handle batch progress
    // if (updatedImage.batchId) {
    //   await Batch.findByIdAndUpdate(updatedImage.batchId, { status: "failed" });
    // }
  }
};

module.exports = {
  processImage,
};

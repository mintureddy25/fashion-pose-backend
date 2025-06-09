const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: false, 
    index: true,
    default: null,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  views: {
    full: { type: String, default: null },
    neck: { type: String, default: null },
    sleeve: { type: String, default: null },
    waist: { type: String, default: null },
    length: { type: String, default: null },
    zoomed: { type: String, default: null },
  },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", ImageSchema);

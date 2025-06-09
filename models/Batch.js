const mongoose = require("mongoose");

const BatchSchema = new mongoose.Schema({
  totalImages: { type: Number, default: 0 },
  processedImages: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

BatchSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "batchId",
});

module.exports = mongoose.model("Batch", BatchSchema);

const tf = require('@tensorflow/tfjs-node');
const posenet = require('@tensorflow-models/posenet');
const { createCanvas } = require('canvas');

/**
 * Crop and resize a region from ctx.canvas, with clamping to prevent out-of-bounds.
 * Returns a canvas of size targetWidth x targetHeight.
 */
const cropRegion = (ctx, x, y, width, height, targetWidth, targetHeight) => {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  // Clamp inputs
  const srcX = clamp(x, 0, ctx.canvas.width);
  const srcY = clamp(y, 0, ctx.canvas.height);
  const srcW = clamp(width, 0, ctx.canvas.width - srcX);
  const srcH = clamp(height, 0, ctx.canvas.height - srcY);

  const cropCanvas = createCanvas(targetWidth, targetHeight);
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.clearRect(0, 0, targetWidth, targetHeight);

  cropCtx.drawImage(
    ctx.canvas,
    srcX,
    srcY,
    srcW,
    srcH,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return cropCanvas;
};

const generateViews = async (img) => {
  const net = await posenet.load();
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const input = tf.browser.fromPixels(canvas);
  const pose = await net.estimateSinglePose(input);
  input.dispose();

  const get = (part) => pose.keypoints.find((kp) => kp.part === part)?.position;

  // Get keypoints, throw error if essentials missing
  const nose = get("nose");
  const leftShoulder = get("leftShoulder");
  const rightShoulder = get("rightShoulder");
  const leftHip = get("leftHip");
  const rightHip = get("rightHip");
  const leftKnee = get("leftKnee");
  const rightKnee = get("rightKnee");
  const leftAnkle = get("leftAnkle");
  const rightAnkle = get("rightAnkle");

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    throw new Error("Essential keypoints not detected.");
  }

  const fullWidth = canvas.width;
  const fullHeight = canvas.height;

  const views = {};
  views.full = canvas.toBuffer('image/png');

  // Neck View (same as frontend)
  const neckLeft = Math.min(leftShoulder.x, rightShoulder.x);
  const neckRight = Math.max(leftShoulder.x, rightShoulder.x);
  const neckTop = 0;
  const neckBottom = Math.max(leftShoulder.y, rightShoulder.y);

  views.neck = cropRegion(
    ctx,
    neckLeft,
    neckTop,
    neckRight - neckLeft,
    neckBottom - neckTop,
    fullWidth,
    fullHeight
  ).toBuffer();

  // Sleeve View, require nose and leftHip
  if (!nose || !leftHip) {
    throw new Error("Additional keypoints for sleeve not detected.");
  }

  views.sleeve = cropRegion(
    ctx,
    nose.x,
    nose.y,
    fullWidth - nose.x,
    leftHip.y - nose.y,
    fullWidth,
    fullHeight
  ).toBuffer();

  // Waist View — updated with frontend style average bounding box calculation
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  // Calculate corners for waist box based on frontend logic
  const topLeftX = Math.min(rightHip.x, leftHip.x) / 2;
  const topLeftY = (rightShoulder.y + rightHip.y) / 2;

  const topRightX = (leftHip.x + fullWidth) / 2;
  const topRightY = topLeftY;

  const bottomLeftX = topLeftX;
  const bottomLeftY = (rightHip.y + rightKnee.y) / 2;

  const bottomRightX = topRightX;
  const bottomRightY = bottomLeftY;

  const x = clamp(Math.min(topLeftX, bottomLeftX), 0, fullWidth);
  const y = clamp(Math.min(topLeftY, bottomLeftY), 0, fullHeight);
  const maxX = clamp(Math.max(topRightX, bottomRightX), 0, fullWidth);
  const maxY = clamp(Math.max(topRightY, bottomRightY), 0, fullHeight);

  const width = Math.max(1, maxX - x);
  const height = Math.max(1, maxY - y);

  views.waist = cropRegion(ctx, x, y, width, height, fullWidth, fullHeight).toBuffer();

  // Length View - require knees and ankles
  if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    throw new Error("Additional keypoints for length not detected.");
  }

  const lengthTop = Math.max(0, Math.min(leftKnee.y, rightKnee.y) - 30);
  const lengthBottom = Math.min(fullHeight, Math.max(leftAnkle.y, rightAnkle.y) + 30);
  const lengthLeft = Math.max(0, Math.min(leftKnee.x, rightKnee.x) - 60);
  const lengthRight = Math.min(fullWidth, Math.max(leftKnee.x, rightKnee.x) + 60);

  views.length = cropRegion(
    ctx,
    lengthLeft,
    lengthTop,
    lengthRight - lengthLeft,
    lengthBottom - lengthTop,
    fullWidth,
    fullHeight
  ).toBuffer();

  // Zoomed View (center torso)
  const zoomX = (leftShoulder.x + rightShoulder.x) / 2 - 75;
  const zoomY = (leftShoulder.y + leftHip.y) / 2 - 75;

  views.zoomed = cropRegion(ctx, zoomX, zoomY, 150, 150, fullWidth, fullHeight).toBuffer();

  return views;
};

module.exports = { generateViews };

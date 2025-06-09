require('dotenv').config();
const { processImage } = require("./workers/processor");
const RabbitMQService = require("./services/rabbitMQ");
const connectDB = require('./services/db');

require("dotenv").config();

connectDB();

const startWorker = async () => {
  try {
    const channel = await RabbitMQService.getChannel();

    channel.consume(
      "image-processing",
      async (msg) => {
        if (!msg) return;

        try {
          const { imageId, imageUrl } = JSON.parse(msg.content.toString());
          await processImage(imageId, imageUrl);
          channel.ack(msg);
        } catch (err) {
          console.error("Error processing message:", err);
          // Optionally: dead-letter or requeue logic here
        }
      },
      { noAck: false }
    );

    console.log("Worker is running and listening for messages...");
  } catch (err) {
    console.error("Failed to start worker:", err);
  }
};

startWorker();

const amqp = require("amqplib");

class RabbitMQService {
  static instance;

  constructor() {
    if (RabbitMQService.instance) {
      return RabbitMQService.instance;
    }

    this.connection = null;
    this.channel = null;
    this.queueName = "image-processing";
    this.isConnecting = false;

    RabbitMQService.instance = this;
  }

  async connect() {
    if (this.channel || this.isConnecting) return this.channel;

    this.isConnecting = true;
    try {
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://localhost"
      );
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });

      console.log("RabbitMQ connected and queue asserted.");
      return this.channel;
    } catch (err) {
      console.error("RabbitMQ connection error:", err);
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  async getChannel() {
    if (this.channel) return this.channel;
    return await this.connect();
  }

  async sendToQueue(data) {
    const channel = await this.connect();
    channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    console.log("🔒 RabbitMQ connection closed.");
  }
}

module.exports = new RabbitMQService();

# Rubik Backend API

🚀 **Live API**: [rb.saiteja.online](https://rb.saiteja.online)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fashion-pose-backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment setup**
   - Copy `.env.example` to `.env`
   - Configure your environment variables

4. **Start the server**
   ```bash
   yarn run dev
   ```

## Database Schema

📊 **Database Diagram**: [View on DBDiagram](https://dbdiagram.io/d/fashionpose-68464cb65a9a94714e776d18)

![Database Schema](https://toleram.s3.ap-south-1.amazonaws.com/Screenshot+from+2025-06-09+08-27-19.png)

## API Endpoints

### Single Upload API
- Process individual images
- Generate all views/variations
- Return processed results immediately

### Batch Upload API
- Handle multiple image uploads
- Add jobs to processing queue
- Return job IDs for status tracking

## Architecture

### Queue-Based Processing
1. **API Server** - Handles requests and adds jobs to queue
2. **RabbitMQ Queue** - Manages job queue for batch processing
3. **Worker Process** (`worker.js`) - Background processor that:
   - Monitors the queue for new jobs
   - Processes images and generates views
   - Updates job status in real-time

### Background Worker
The `worker.js` file runs as a separate process:
- Can be managed as a system service
- Supports cron scheduling
- Continuously processes queued items
- Updates status and results

## Built With

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **RabbitMQ** - Message queue system
- **Worker.js** - Background job processing

## Deployment

Deployed on **AWS EC2** instance with:
- System service management for workers
- Cron job scheduling support
- High availability setup

---

*Scalable backend API designed for efficient image processing workflows.*

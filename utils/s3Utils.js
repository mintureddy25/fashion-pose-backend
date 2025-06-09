const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (buffer, key) => {
  const res = await s3.upload({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read',
  }).promise();

  return res.Location;
};

module.exports = {
  uploadToS3
};

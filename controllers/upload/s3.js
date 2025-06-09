const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const express = require("express");
const router = express.Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post("/generate-presigned-urls", async (req, res) => {
  const { files } = req.body;

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files provided" });
  }

  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  try {
    const results = await Promise.all(files.map(async ({ fileName, fileType }) => {
      if (!allowedImageTypes.includes(fileType)) {
        return {
          error: `Invalid format for file: ${fileName}. Allowed: jpeg, jpg, png, gif, webp.`,
          fileName,
        };
      }

      const uniqueKey = `toleram/${uuidv4()}-${fileName}`;

      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uniqueKey,
        ContentType: fileType,
        ACL: 'public-read',
      };

      const command = new PutObjectCommand(s3Params);
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

      return { presignedUrl, imageUrl, fileName };
    }));

    res.json({ urls: results });
  } catch (error) {
    console.error("Error generating presigned URLs", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

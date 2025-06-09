const express = require("express");
const app = express();
cors = require("cors");
require("dotenv").config();
const connectDB = require("./services/db");

connectDB();

app.use(express.json());
app.use(cors());

const s3Routes = require("./controllers/upload/s3");
const batchRoutes = require("./controllers/upload/batch");
const imageRoutes = require("./controllers/upload/images");
app.use("/s3", s3Routes);
app.use("/upload", imageRoutes, batchRoutes);



// Start the server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
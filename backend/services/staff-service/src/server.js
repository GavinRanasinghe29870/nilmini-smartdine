const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = require("./app");
const connectDB = require("./config/db");

const port = process.env.PORT || 5002;

async function startServer() {
  await connectDB();

  app.listen(port, () => {
    console.log(`Staff service running on port ${port}`);
  });
}

startServer();
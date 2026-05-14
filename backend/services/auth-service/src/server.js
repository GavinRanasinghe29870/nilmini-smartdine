const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = require("./app");
const connectDB = require("./config/db");
require("./config/redis");

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Auth service listening on ${PORT}`);
    });
  } catch (err) {
    console.error("Auth service failed to start:", err.message);
    process.exit(1);
  }
}

start();
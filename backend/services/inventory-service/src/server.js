require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5003;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Inventory service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start inventory service:", error.message);
    process.exit(1);
  }
}

startServer();
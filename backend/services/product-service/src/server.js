require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const seedDefaultCategories = require("./seed/seedDefaultCategories");

const PORT = process.env.PORT || 5004;

async function start() {
  try {
    await connectDB();
    await seedDefaultCategories();

    app.listen(PORT, () => {
      console.log(`Product service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Product service start error:", error);
    process.exit(1);
  }
}

start();
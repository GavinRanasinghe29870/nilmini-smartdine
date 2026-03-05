require("dotenv").config({ path: "src/.env" });

const app = require("./app");
const connectDB = require("./config/db");

const port = process.env.PORT || 4001;

(async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Staff service running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start staff service:", err.message);
    process.exit(1);
  }
})();

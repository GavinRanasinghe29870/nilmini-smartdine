const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5006;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Order service failed to start:", error.message);
    process.exit(1);
  });
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = require("./app");

const port = process.env.PORT || 5002;

app.listen(port, () => {
  console.log(`Staff service running on port ${port}`);
});
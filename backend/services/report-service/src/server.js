const app = require("./app");

const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
  console.log(`Report service running on http://localhost:${PORT}`);
});
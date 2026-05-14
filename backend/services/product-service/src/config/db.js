const mongoose = require("mongoose");

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "smartdine_product_service",
  });

  console.log("Product service DB connected");
}

module.exports = connectDB;
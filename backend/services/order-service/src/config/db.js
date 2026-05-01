const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in order-service .env file");
  }

  await mongoose.connect(mongoUri, {
    dbName: dbName || undefined,
  });

  console.log("Order service connected to MongoDB");
}

module.exports = connectDB;
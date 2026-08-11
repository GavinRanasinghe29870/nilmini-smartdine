const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    itemId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      enum: ["g", "ml", "Piece"],
      default: "g",
    },
    availability: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

inventorySchema.pre("save", function () {
  this.availability = this.quantity > 0 ? "In Stock" : "Out of Stock";
});

module.exports = mongoose.model("InventoryItem", inventorySchema);
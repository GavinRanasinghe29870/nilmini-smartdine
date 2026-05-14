const Category = require("../models/category.model");

async function seedDefaultCategories() {
  const count = await Category.countDocuments();
  if (count > 0) return;

  await Category.insertMany([
    {
      name: "Pizza",
      description: "Pizza items",
      icon: "Pizza",
      image: "",
    },
    {
      name: "Burger",
      description: "Burger items",
      icon: "Hamburger",
      image: "",
    },
    {
      name: "Chicken",
      description: "Chicken-based dishes",
      icon: "Drumstick",
      image: "",
    },
    {
      name: "Bakery",
      description: "Bakery products",
      icon: "Croissant",
      image: "",
    },
    {
      name: "Beverage",
      description: "Drinks and beverages",
      icon: "CupSoda",
      image: "",
    },
    {
      name: "Seafood",
      description: "Seafood items",
      icon: "Fish",
      image: "",
    },
  ]);

  console.log("Default categories seeded");
}

module.exports = seedDefaultCategories;
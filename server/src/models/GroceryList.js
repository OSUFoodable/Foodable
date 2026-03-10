// Foodable\server\src\models\GroceryList.js
import mongoose from "mongoose";

const groceryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      default: 1,
    },
    unit: {
      type: String,
      default: "count",
    },
    category: {
      type: String,
      default: "other",
    },
  },
  { _id: false }
);

const groceryListSchema = new mongoose.Schema(
  {
    owner: {
      type: String, // cognito username
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Grocery List",
    },
    items: {
      type: [groceryItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const GroceryList = mongoose.model("GroceryList", groceryListSchema);

export default GroceryList;
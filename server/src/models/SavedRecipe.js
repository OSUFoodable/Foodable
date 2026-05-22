// server/src/models/SavedRecipe.js
import mongoose from "mongoose";

const savedRecipeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    recipeId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ingredients: [
      {
        type: String,
        required: true,
      },
    ],
    instructions: {
      type: String,
      required: true,
    },
    nutrition: {
      calories: {
        type: Number,
        default: null,
      },
      protein: {
        type: Number,
        default: null,
      },
      carbs: {
        type: Number,
        default: null,
      },
      fat: {
        type: Number,
        default: null,
      },
    },
  },
  { timestamps: true }
);

const SavedRecipe = mongoose.model("SavedRecipe", savedRecipeSchema);

export default SavedRecipe;
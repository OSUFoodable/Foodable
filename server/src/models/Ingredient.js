import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	qty: {
		type: Number,
		default: 0,
	},
	unit: {
		type: String,
		default: "count",
	},
	addedAt: {
		type: Date,
		default: Date.now,
	},
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

export default Ingredient;

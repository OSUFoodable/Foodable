import mongoose from "mongoose";

const dietPrefsSchema = new mongoose.Schema(
  {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    pescatarian: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    _id: { type: String }, // Cognito sub
    email: {
      type: String,
      required: true,
      index: true,
    },
    username: { type: String },
    dietPrefs: {
      type: dietPrefsSchema,
      default: () => ({}),
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

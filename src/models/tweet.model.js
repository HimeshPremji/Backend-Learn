import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required"],
      minLength: [5, "Tweet must be at least 5 characters long"],
      maxLength: [280, "Tweet cannot exceed 280 characters"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Tweet = mongoose.model("Tweet", tweetSchema);

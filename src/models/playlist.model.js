import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      minLength: [4, "name must be at least 4 characters long"],
      maxLength: [60, "name cannot exceed 60 characters"],
    },
    description: {
      type: String,
      required: [true, "Playlist description is required"],
      minLength: [4, "description must be at least 4 characters long"],
      maxLength: [280, "description cannot exceed 280 characters"],
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Playlist = mongoose.model("Playlist", playlistSchema);

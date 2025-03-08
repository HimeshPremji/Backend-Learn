import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  // TODO: create tweet
  const user = req.user;
  const { content } = req.body;

  if (!content?.trim()) {
    return res
      .status(400)
      .json(new ApiError(400, "Tweet content is required."));
  }
  if (content.length > 280) {
    return res
      .status(400)
      .json(new ApiError(400, "Tweet is too long (max 280 chars)."));
  }

  const newTweet = await Tweet.create({
    content,
    owner: user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    return res.status(400).json(new ApiError(400, "Invalid user ID."));
  }

  const userTweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .lean(); // Improves performance

  if (!userTweets.length) {
    return res
      .status(404)
      .json(new ApiError(404, "No tweets found for this user."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userTweets, "User tweets fetched successfully."),
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  // TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    return res.status(400).json(new ApiError(400, "Invalid tweet ID."));
  }
  if (!content?.trim()) {
    return res
      .status(400)
      .json(new ApiError(400, "Tweet content is required."));
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    { new: true, runValidators: true },
  );

  if (!updatedTweet) {
    return res.status(404).json(new ApiError(404, "Tweet not found."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  // TODO: delete tweet
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId))
    return res.status(400).json(new ApiError(400, "Invalid tweet ID."));

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) {
    return res.status(404).json(new ApiError(404, "Tweet not found."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully."));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

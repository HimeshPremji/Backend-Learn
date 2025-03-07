import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  const like = await Like.findOne({ video: videoId, likedBy: userId });

  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res.status(200).json(new ApiResponse(200, {}, "Video unliked."));
  }

  const newLike = await Like.create({ video: videoId, likedBy: userId });
  return res.status(200).json(new ApiResponse(200, newLike, "Video liked."));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const commentLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (commentLike) {
    await Like.findByIdAndDelete(commentLike._id);
    return res.status(200).json(new ApiResponse(200, {}, "Comment unliked."));
  }

  const newLike = await Like.create({ comment: commentId, likedBy: userId });
  return res.status(200).json(new ApiResponse(200, newLike, "Comment liked."));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  const tweetLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

  if (tweetLike) {
    await Like.findByIdAndDelete(tweetLike._id);
    return res.status(200).json(new ApiResponse(200, {}, "Tweet unliked."));
  }

  const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
  return res.status(200).json(new ApiResponse(200, newLike, "Tweet liked."));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const allLikedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: isValidObjectId(userId)
          ? new mongoose.Types.ObjectId(userId)
          : userId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: "$video",
    },
    {
      $project: {
        _id: 0,
        video: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allLikedVideos,
        "Liked videos retrieved successfully.",
      ),
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

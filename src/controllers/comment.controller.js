import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/videos.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const comments = await Comment.findById({ video: videoId })
    .populate("owner", "content")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const video = await Video.findById(req.params.videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const comment = new Comment({
    content: req.body.content,
    video: video._id,
    owner: req.user._id,
  });
  await comment.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, comment, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }
  comment.content = req.body.content;
  await comment.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, comment, "Comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  try {
    if (!deletedComment) {
      throw new ApiError(404, "Comment not found");
    } else {
      return res
        .status(200)
        .json(
          new ApiResponse(200, deletedComment, "Comment deleted successfully"),
        );
    }
  } catch (error) {
    throw new ApiError(500, "An error occurred while deleting the comment");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };

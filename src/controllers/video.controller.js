import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videos.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    throw new ApiError(400, "Video and thumbnail are required.");
  }

  const videoPath = req.files.videoFile[0].path;
  const thumbnailPath = req.files.thumbnail[0].path;

  const videoUpload = await uploadOnCloudinary(videoPath);
  if (!videoUpload?.url) {
    throw new ApiError(400, "Error uploading video.");
  }

  const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);
  if (!thumbnailUpload?.url) {
    throw new ApiError(400, "Error uploading thumbnail.");
  }

  const { url: videoUrl, duration } = videoUpload;

  const newVideo = await Video.create({
    title,
    description,
    videoUrl,
    duration,
    thumbnailUrl: thumbnailUpload.url,
    uploadedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully."));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "Video ID is required.");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId) || videoId,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        videoUrl: 1,
        duration: 1,
        thumbnailUrl: 1,
        uploadedBy: 1,
        createdAt: 1,
      },
    },
  ]);

  const findVideo = videos[0] || null;
  if (!findVideo) throw new ApiError(404, "Video not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, findVideo, "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  // We are using cloudinary for video and thumbnail
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailFile = req.file;

  if (!videoId) throw new ApiError(400, "Video ID is required.");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found.");

  let updatedTitle = title || video.title;
  let updatedDescription = description || video.description;
  let updatedThumbnail = video.thumbnailUrl;

  if (thumbnailFile) {
    const thumbnailUpload = await uploadOnCloudinary(thumbnailFile.path);
    if (!thumbnailUpload?.url) {
      throw new ApiError(400, "Error uploading thumbnail.");
    }
    updatedThumbnail = thumbnailUpload.url;
  }

  video.title = updatedTitle;
  video.description = updatedDescription;
  video.thumbnailUrl = updatedThumbnail;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully."));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params.videoId;
  //TODO: delete video
  if (!videoId) throw new ApiError(400, "Video ID is required.");

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) throw new ApiError(404, "Video not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video ID is required.");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found.");

  // if isPublished is true ! NOT operator turns it to false, if its condition is false ! NOT operator turns it to true ❤
  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        video.isPublished
          ? "Video published successfully."
          : "Video privated successfully.",
      ),
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

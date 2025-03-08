import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const user = req.user;

  if (!name?.trim()) {
    throw new ApiError(400, "Playlist name is required.");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully."));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const playlists = await Playlist.find({ owner: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (!playlists.length) {
    return res
      .status(404)
      .json(new ApiError(404, "No playlists found for this user."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully."),
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid playlist ID."));
  }

  const playlist = await Playlist.findById(playlistId).lean();
  if (!playlist) {
    return res.status(404).json(new ApiError(404, "Playlist not found."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully."));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID.");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found.");

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already in playlist.");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist."));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true },
  );

  if (!playlist) throw new ApiError(404, "Playlist not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist."));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID.");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    return res.status(404).json(new ApiError(404, "Playlist not found."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid playlist ID."));
  }

  if (!name?.trim() || name.length < 4 || name.length > 60) {
    throw new ApiError(400, "Name must be between 4 and 60 characters long.");
  }

  if (
    !description?.trim() ||
    description.length < 4 ||
    description.length > 280
  ) {
    throw new ApiError(
      400,
      "Description must be between 4 and 280 characters long.",
    );
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { name, description },
    { new: true, runValidators: true },
  );

  if (!playlist) throw new ApiError(404, "Playlist not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully."));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

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
  //TODO: get user playlists
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
      new ApiResponse(200, playlist, "User playlist fetched successfully."),
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid playlist ID."));
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    return res.status(404).json(new ApiError(404, "Playlist not found."));
  }

  return res
    .status(200)
    .josn(ApiResponse(200, playlist, "Playlist fetched successfully."));
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
    .josn(ApiResponse(200, playlist, "Video added to playlist."));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
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

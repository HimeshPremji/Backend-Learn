import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const cookiesOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Failed to generate access and refresh tokens. Please try again.",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existedUser = await User.findOne({ username });
  if (existedUser) {
    throw new ApiError(409, "Username already exists.");
  }

  const existedEmail = await User.findOne({ email });
  if (existedEmail) {
    throw new ApiError(409, "Email address already registered.");
  }

  // User  checked now

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath && avatarLocalPath === undefined)
    throw new ApiError(400, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "Avatar is required.");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while registering the user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email)
    throw new ApiError(400, "Username or email is required.");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "Account not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid)
    throw new ApiError(
      401,
      "Invalid credentials. Please check your login details.",
    );

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookiesOptions)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully.",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $usset: { refreshToken: 1 }, // removes the field from user document
      },
      { new: true },
    );

    return res
      .status(200)
      .clearCookie("accessToken", cookiesOptions)
      .clearCookie("refreshToken", cookiesOptions)
      .json(new ApiResponse(200, {}, "User logged out successfully."));
  } catch (error) {
    throw new ApiError(404, "User is not logged in.");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // console.log("req.cookies.refreshToken", req.cookies.refreshToken);
  // console.log("refreshToken Variable is", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Authorization required. Please authenticate.");
  }

  try {
    // jwt tokens which are encrypted are inside incomingRefreshToken
    // console.log("AFTER refreshToken Variable is AFTER", incomingRefreshToken);
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // console.log("decodedToken", decodedToken);
    // console.log("decodedToken id here", decodedToken._id);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token.");
    }
    // console.log("User found:", user);
    // console.log("User's stored refresh token:", user?.refreshToken);
    // console.log("Incoming refresh token:", incomingRefreshToken);

    // jwt tokens which are encrypted are inside user?.refreshToken
    // if both tokens doesnt match it meants somethings wrong with the tokens
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id,
    );
    // console.log("Generated new refresh token:", refreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookiesOptions)
      .cookie("refreshToken", refreshToken, cookiesOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully.",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError(400, "Invalid Password.");

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirmation do not match.");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const getCurrectUser = asyncHandler(async (req, res) => {
  // console.log("your username is ", req.user);
  return res
    .status(200)
    .json(200, req.user, "Current user retrieved successfully.");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { newFullName, newUserName } = req.body;
  try {
    if (!newFullName && !newUserName) {
      throw new ApiError(400, "No fields to update");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName: newFullName,
          username: newUserName,
        },
      },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUser,
          "Account details updated successfully.",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Acccess");
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatar = req.file?.path;

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const cloudAvatar = await uploadOnCloudinary(avatar);
  if (!cloudAvatar.url) {
    throw new ApiError(400, "Error while uploading avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: cloudAvatar.url } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImage = req.file?.path;

  if (!coverImage) {
    throw new ApiError(400, "Cover image file is required.");
  }

  const cloudCoverImage = await uploadOnCloudinary(coverImage);

  if (!cloudCoverImage.url) {
    throw new ApiError(400, "Error while uploading cover image.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: cloudCoverImage.url } },
    { new: true },
  ).select("-password");

  // Delete old picture from public file

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(500, "Username is required to fetch channel details.");
  }

  const channel = await User.aggregate([
    {
      // Step 1: Match the user based on the provided username (case insensitive)
      $match: {
        username: username?.toLowerCase(), // Convert username to lowercase to ensure consistency in search
      },
    },
    {
      // Step 2: Lookup subscriptions where the user is referenced as a channel
      $lookup: {
        from: "subscriptions", // Collection that stores subscription details
        localField: "_id", // The user's unique ID from the User collection
        foreignField: "channel", // The 'channel' field in subscriptions, which stores user IDs of subscribed channels
        as: "subscribers", // The matched subscription documents will be stored in a new array field named 'subscribers'
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel detail fetched successfully."),
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      // Step 1: Find the user by their unique _id
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id), // Convert req.user._id into an ObjectId to match the MongoDB format
      },
    },
    {
      // Step 2: Perform a lookup to fetch video details for each video in the user's watch history
      $lookup: {
        from: "videos", // Reference the 'videos' collection
        localField: "watchHistory", // The 'watchHistory' array in the User schema contains video IDs
        foreignField: "_id", // Match these video IDs with the '_id' field in the 'videos' collection
        as: "watchHistory", // Store the matched video documents in the 'watchHistory' array

        // Step 3: Use a pipeline to further modify the video objects in watch history
        pipeline: [
          {
            // Nested lookup to fetch owner details for each video
            $lookup: {
              from: "users", // Reference the 'users' collection
              localField: "owner", // The 'owner' field in videos refers to the user who uploaded it
              foreignField: "_id", // Match the owner's '_id' in the 'users' collection
              as: "owner", // Store the matched user details in the 'owner' array

              // Step 4: Select only specific fields from the user (owner) data
              pipeline: [
                {
                  $project: {
                    fullName: 1, // Include only the full name of the owner
                    username: 1, // Include the username of the owner
                    avatar: 1, // Include the avatar of the owner
                  },
                },
              ],
            },
          },
          {
            // Step 5: Convert 'owner' array into a single object (since lookup returns an array)
            $addFields: {
              owner: {
                $first: "$owner", // Extract the first element from the 'owner' array (since a video has only one owner)
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history retrieved successfully.",
      ),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrectUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};

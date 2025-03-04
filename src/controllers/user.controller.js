import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { User } from '../models/user.model.js';

// get user details from frontend
// validation - not empty etc
// check if use alerady exists: username, email
// check for avatar and cover images
// upload images to cloudinary
// create user  object - create entry in DB
// remove password and refreshtoken field from response
// check for user creation
// return response(res)

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  const existedUser = User.findOne({ username });
  if (existedUser) {
    throw new ApiError(409, 'Another user with this username already exists');
  }

  const existedEmail = User.findOne({ email });
  if (existedEmail) {
    throw new ApiError(409, 'Another user with this email already exists');
  }

  // User  checked now
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, 'Avatar file is required');

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, 'Avatar file is required');

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = (await User.findById(user._id)).select(
    '-password -refreshToken'
  );

  if (!createdUser) {
    throw new ApiError(500, 'Somthing went wrong while registering the user');
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, 'User registered Successfully'));
});

export { registerUser };

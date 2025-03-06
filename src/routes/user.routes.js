import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: "1" },
    { name: "coverImage", maxCount: "1" },
  ]),
  registerUser
);

// Authentication routes
router.route("/auth/login").post(loginUser);
router.route("/auth/logout").post(verifyJWT, logoutUser);
router.route("/auth/refresh-token").post(refreshAccessToken);

// User account routes
router
  .route("/me")
  .get(verifyJWT, getCurrectUser) // GET /me
  .patch(verifyJWT, updateAccountDetails); // PATCH /me

router.route("/me/password").patch(verifyJWT, changeCurrentPassword); //me/password

// Media update routes
router
  .route("/me/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/me/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// Channel and history routes
router.route("/channels/:username").get(getUserChannelProfile);
router.route("/me/watch-history").get(verifyJWT, getWatchHistory);

export default router;

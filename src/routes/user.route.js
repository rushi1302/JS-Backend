import { Router } from "express";
import { changeUserPassword, getCurrentUserDetails, loginUser, logoutUser, refreshAccessToken, registerUser, updateCoverImage, updateUserDetails, userAvatarUpdate } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";
const router = Router();

router.route('/register').post(upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), registerUser)

router.route('/login').post(loginUser)

// protected route
router.route('/logout').post(jwtVerify, logoutUser)

router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(jwtVerify, changeUserPassword)
router.route('/user-details').post(jwtVerify, getCurrentUserDetails)
router.route('/update-user-details').post(jwtVerify, updateUserDetails)
router.route('/avatar-update').post(upload.fields([{ name: "avatar", maxCount: 1 }]), jwtVerify, userAvatarUpdate)
router.route('/coverimage-update').post(upload.fields([{ name: "coverImage", maxCount: 1 }]), jwtVerify, updateCoverImage)
export default router;

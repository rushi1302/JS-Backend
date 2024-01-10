import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const jwtVerify = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // console.log(token);

        if (!token) {
            throw new ApiError(401, "Unauthorized Request - Please login your account")
        }


        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log(decodedToken);

        const user = await User.findById(decodedToken?._id).select("-password,-refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        //  req is an object so here I added user property so we can access this user in logoutUser function.

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})

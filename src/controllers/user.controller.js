import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// lets create a function to create access and refresh token: 
const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}
// to register user
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validations 
    //check if user already exist
    // check for images and avtars
    //upload them on cloudinary
    // create user object and entry in database
    // remove password and refresh token feild from response 
    // check for user creation
    // return response.

    const { userName, email, fullName, password } = req.body

    if ([userName, email, fullName, password].some((feild) => {
        feild?.trim() === ""
    })) {
        throw new ApiError(400, "All feild are required")
    }

    if (!email.includes("@")) {
        throw new ApiError(400, "Please provide valid email address.")
    }
    if (password.length < 5) {
        throw new ApiError(400, "Password must be greater than 5 characters.")
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new ApiError(401, "User Already Exist")
    }


    // req.files bcz we will get our images in files path

    // we need a strict check here what if user doesnt send the avatar file we need to send an error

    // const avatarLocalPath = req.files?.avatar[0]?.path

    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    else {
        throw new ApiError(400, "Avatar image is required for registration")
    }

    // coverImage is optional but when user not add user image it gives undefined error.
    // so this approach is not good to add cover image. we need to strict check.
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    // console.log(req.files)

    // console.log(avatarLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avtar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log(avatar)

    if (!avatar) {
        throw new ApiError(401, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while regeistering the user")
    }

    return res.status(200).json(new ApiResponse(200, createdUser, "User registered successfully"))
})

// to login user
const loginUser = asyncHandler(async (req, res) => {
    // take username email and password from req.body
    // find user by using email
    // validate password
    // send access token and refresh token
    const { email, userName, password } = req.body;
    // console.log(email, userName);


    if (!userName && !email) {
        throw new ApiError(400, "username and email is required.")
    }

    const user = await User.findOne({
        $or: [{ email }, { userName }]
    })
    // console.log(user);
    if (!user) {
        throw new ApiError(401, "User Not Found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Unauthorized please provide correct password")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: loggedinUser,
            accessToken,
            refreshToken
        }, "user logged in successfully"))

})

// code for logout
// here we have a problem we dont have any data of user then how can we access user
// by using middleware - in app.js we have used cookie parser middleware it means we are storing our cookies in client server so whenever any req come from client we have an access of cookies where we stored our access token and access token have an information of user id and email. so we can use this information of user to logout the user.
// here we will write this logic inside middleware because I want to reuse this code.

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        http: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User Logged out successfully"))
})



// code for refresh access token- read ReadMe.md file
// you can create middleware also for this code.

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Unauthorized Request")
    }

    const validateIncomingRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    // console.log(validateIncomingRefreshToken);
    const user = await User.findById(validateIncomingRefreshToken._id);
    if (!user) {
        throw new ApiError(401, "Invalid Refresh Token");
    }
    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used.")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const { accessToken, newRefreshToken } = generateAccessTokenAndRefreshTokens(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token Refreshed"))

})

// code for change password

const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!(oldPassword && newPassword)) {
        throw new ApiError(401, "Please provide password")
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    // console.log(user);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Please provide correct old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, "Password Updated Successfully"))
})

// controller for gettingUserDetails 

const getCurrentUserDetails = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized - Please login your account")
    }
    res.status(200).json(new ApiResponse(200, req.user, "Current User Fetched Successfully"))
})

// controller for update userDetails

const updateUserDetails = asyncHandler(async (req, res) => {
    const { userName, email, fullName } = req.body;

    if ([userName, email, fullName].some((feild) => {
        feild.trim === ""
    })) {
        throw new ApiError(401, "Please provide All feilds")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                userName,
                email,
                fullName
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(400, "User Not Found")
    }
    res.status(200).json(new ApiResponse(200, user, "userDetails updated Successfully"))

})

// if you want to update files -[images, videos, pdfs] it is always best practise to write new route for it.
const userAvatarUpdate = asyncHandler(async (req, res) => {
    // WHEN YOU SEND DATA FROM FORM DO NOR USE DOUBLE QUOTE
    const avatarLocalPath = req.files.avatar[0].path
    console.log(req.files);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Avatar Image updated successfully"))

})

// controller for update cover image
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.files.coverImage[0].path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please update cover image")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Cover Image uploaded Successfully"))

})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeUserPassword, getCurrentUserDetails, updateUserDetails, userAvatarUpdate, updateCoverImage }
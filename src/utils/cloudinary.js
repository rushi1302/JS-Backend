import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("File has been successfully uploaded : ", response.url);
        fs.unlinkSync(localFilePath)
        // console.log(response);
        return response // console.log(response) try to read docs of cloudinary

    } catch (error) {
        fs.unlinkSync(localFilePath) // it removes the locally saved temporary files as operation got failed.
        return null
    }
}

export { uploadOnCloudinary }
const cloudinary = require('cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;
    try {
        const result = await cloudinary.v2.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        return result.secure_url;
    } catch (error) {
        console.log("Can not upload image to cloudinary :: ", error);
    }
}

module.exports = uploadCloudinary;
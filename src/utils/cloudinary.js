import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const ab = async function () {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return console.error('localFilePath is not Defined !!');
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    console.log(`File is uploaded to Cloudinary at ${result.url}`);
    return result;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error('Upload Operation got failed !!! ', error);
    return null;
  }
};

export { uploadOnCloudinary };

 import crypto from "crypto";
import { errorHandler } from "../utils/error.js";

const CLOUDINARY_UPLOAD_URL = (cloudName) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

const createCloudinarySignature = (params, apiSecret) => {
  const stringToSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${stringToSign}${apiSecret}`)
    .digest("hex");
};

export const uploadImage = async (req, res, next) => {
  try {
    const { image, folder = "shelter-seeker/uploads" } = req.body;

    if (!image) {
      return next(errorHandler(400, "Image is required"));
    }

    if (!image.startsWith("data:image/")) {
      return next(errorHandler(400, "Only image uploads are allowed"));
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return next(errorHandler(500, "Cloudinary is not configured"));
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signatureParams = { folder, timestamp };
    const signature = createCloudinarySignature(signatureParams, apiSecret);

    const formData = new FormData();
    formData.append("file", image);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folder);
    formData.append("signature", signature);

    const uploadRes = await fetch(CLOUDINARY_UPLOAD_URL(cloudName), {
      method: "POST",
      body: formData,
    });

    const data = await uploadRes.json();

    if (!uploadRes.ok) {
      return next(
        errorHandler(
          uploadRes.status,
          data?.error?.message || "Cloudinary upload failed"
        )
      );
    }

    return res.status(201).json({
      url: data.secure_url,
      publicId: data.public_id,
    });
  } catch (error) {
    next(error);
  }
};

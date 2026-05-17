import express from "express";
import { uploadImage } from "../controller/upload.controller.js";
import { verifyToken } from "../utils/verifyToken.js";

const router = express.Router();

router.post("/image", verifyToken, uploadImage);

export default router;

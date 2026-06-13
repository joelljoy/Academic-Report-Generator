import express from "express";
import multer from "multer";
import path from "path";
import { createReport } from "../controllers/reports.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// File filter - ONLY PDFs allowed
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Accept PDF
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit per PDF
  }
});

router.post(
  "/",
  upload.any(),   // accepts all PDF files
  createReport
);

// Error handling for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'PDF file too large. Max 20MB per file.' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

export default router;
import express from "express";
import { downloadPDF, downloadWord } from "../controllers/reportDownload.controller.js";  // ✅ Add downloadWord
// import { downloadPDF}from "../controllers/reportDownload.controller.js";
const router = express.Router();

router.get("/reports/:id/pdf", downloadPDF);
router.get("/reports/:id/word", downloadWord);

export default router;
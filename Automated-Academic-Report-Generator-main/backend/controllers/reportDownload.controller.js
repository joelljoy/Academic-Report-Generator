import db from "../config/db.js";
import { generateCertificationPDF } from "./pdfGenerators/certificationPDF.js";
import { generateWorkshopPDF } from "./pdfGenerators/workshopPDF.js";
import { generateSeminarPDF } from "./pdfGenerators/seminarPDF.js";
import { generateFdpPDF } from "./pdfGenerators/fdpPDF.js";
import { generateSttpPDF } from "./pdfGenerators/sttpPDF.js";
import { generateInhousePDF } from "./pdfGenerators/inhousePDF.js";
import { generateOutreachPDF} from"./pdfGenerators/outreachPDF.js";
import { generateCulturalPDF} from "./pdfGenerators/culturalPDF.js";
import { generateSportsPDF} from "./pdfGenerators/sportsPDF.js";
import { generateCertificationWord} from "./wordGenerators/certificationWord.js"
import {generateInHouseWord} from "./wordGenerators/inhouseWord.js";
import {generateOutreachWord} from "./wordGenerators/outreachWord.js";
import {generateFDPSTTPWord} from "./wordGenerators/fdpSttpWord.js";
import {generateSportsCulturalWord} from "./wordGenerators/sportsCulturalWord.js"
import {generateWorkshopWord} from "./wordGenerators/workshopWord.js";
import {generateSeminarWord} from "./wordGenerators/seminarWord.js";
/* ===================== GET REPORT TYPE ===================== */
const getReportType = (reportId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT report_type FROM reports WHERE report_id = ?",
      [reportId],
      (err, results) => {
        if (err) reject(err);
        if (results && results.length > 0) {
          resolve(results[0].report_type);
        } else {
          reject(new Error("Report not found"));
        }
      }
    );
  });
};

/* ===================== PDF DOWNLOAD HANDLER ===================== */
export const downloadPDF = async (req, res) => {
  try {
    const reportId = req.params.id;
    const reportType = await getReportType(reportId);
    
    switch (reportType) {
      case 'CERTIFICATION':
        await generateCertificationPDF(req, res);
        break;
      
      case 'WORKSHOP':
        await generateWorkshopPDF(req, res);
        break;

      case 'SEMINAR':
        await generateSeminarPDF(req, res);
        break;
      
      case 'FDP':
        await generateFdpPDF(req, res);
        break;
      
      case 'STTP':
        await generateSttpPDF(req, res);
        break;
      
      case 'INHOUSE':
        await generateInhousePDF(req, res);
        break;

      case 'OUTREACH':
        await generateOutreachPDF(req, res);
        break;
      
      case 'CULTURAL':
        await generateCulturalPDF(req, res);
        break;

      case 'SPORTS':
        await generateSportsPDF(req, res);
        break;      
      
      default:
        res.status(400).send(`PDF generation for report type "${reportType}" is not yet implemented. Please contact the development team.`);
    }
  } catch (err) {
    console.error("Report download error:", err);
    if (!res.headersSent) {
      res.status(500).send("Failed to generate PDF: " + err.message);
    }
  }
};

/* ===================== WORD DOWNLOAD HANDLER ===================== */
export const downloadWord = async (req, res) => {
  try {
    const reportId = req.params.id;
    const reportType = await getReportType(reportId);
    
    switch (reportType) {
      case 'CERTIFICATION':
        await generateCertificationWord(req, res);
        break;

      case 'INHOUSE':
        await generateInHouseWord(req, res);
        break;

      case 'OUTREACH':
        await generateOutreachWord(req, res);
        break;
      
      case 'FDP':
        await generateFDPSTTPWord(req, res);
        break;
      
      case 'STTP':
        await generateFDPSTTPWord(req, res);
        break;

      case 'SPORTS':
        await generateSportsCulturalWord(req, res);
        break;

      case 'CULTURAL':
        await generateSportsCulturalWord(req, res);
        break;
      
      case 'SEMINAR':
        await generateSeminarWord(req, res);
        break;
      
      case 'WORKSHOP':
        await generateWorkshopWord(req, res);
        break;

      default:
        res.status(400).send(`Word generation for report type "${reportType}" is not yet implemented. Please contact the development team.`);
    }
  } catch (err) {
    console.error("Word download error:", err);
    if (!res.headersSent) {
      res.status(500).send("Failed to generate Word document: " + err.message);
    }
  }
};

// ❌ REMOVE THIS LINE - it's causing the duplicate export error
// export { downloadPDF, downloadWord };

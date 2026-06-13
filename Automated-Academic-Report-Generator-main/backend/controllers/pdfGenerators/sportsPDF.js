import PDFDocument from "pdfkit";
import db from "../../config/db.js";
import {
  formatReportDate,
  addPageHeader,
  addSectionInline,
  addSectionMultiLine,
  addImageFromFile,
  groupFilesByCategory,
  addSignatureSection
} from "../shared/pdfHelpers.js";

/* ===================== FETCH DATA ===================== */
const getSportsReportData = (reportId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT r.*, 
             rf.file_id, rf.file_category, rf.file_path, rf.caption
      FROM reports r
      LEFT JOIN report_files rf ON r.report_id = rf.report_id
      WHERE r.report_id = ?
      ORDER BY rf.file_category, rf.file_id
      `,
      [reportId],
      (err, rows) => {
        if (err) {
          console.error("Database error in getSportsReportData:", err);
          reject(err);
        }
        console.log("Fetched rows:", rows.length); // ✅ Debug log
        resolve(rows);
      }
    );
  });
};

/* ===================== PDF GENERATION ===================== */
export const generateSportsPDF = async (req, res) => {
  let doc;
  try {
    const reportId = req.params.id;
    console.log("Generating Sports PDF for report ID:", reportId); // ✅ Debug log

    const rows = await getSportsReportData(reportId);
    if (!rows || rows.length === 0) {
      console.error("No report found for ID:", reportId);
      return res.status(404).send("Report not found");
    }

    const report = rows[0];
    console.log("Report data:", report); // ✅ Debug log
    
    const fileGroups = groupFilesByCategory(rows);
    console.log("File groups:", Object.keys(fileGroups)); // ✅ Debug log

    doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 70, right: 50 },
      size: "A4",
      bufferPages: true
    });

    doc.on('error', (err) => {
      console.error("PDFKit Stream Error:", err);
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sports_report_${reportId}.pdf`);
    doc.pipe(res);

    addPageHeader(doc, true, report);

    doc.fontSize(12).font("Helvetica-Bold").text("Report on SPORTS", { align: "center" });
    doc.moveDown(0.8);

    // ✅ Fixed: Name of Department should not have numbering
    const leftMargin = doc.page.margins.left;
    const colonX = 250;
    const contentX = 265;
    const y = doc.y;

    doc.fontSize(10).font("Helvetica-Bold").text("Name of the Department", leftMargin, y, { width: colonX - leftMargin - 5 });
    doc.text(" : ", colonX, y);
    doc.moveDown(0.8);

    addSectionInline(doc, "Name of the Activity/Event", report.activity_name || "N/A", true, 1, report);
    addSectionInline(doc, "Venue", report.venue || "N/A", true, 2, report);

    const formattedDate = formatReportDate(report.start_date, report.end_date);
    addSectionInline(doc, "Date and Duration", formattedDate || "N/A", true, 3, report);

    addSectionInline(doc, "Student Coordinator", report.student_coordinator || "N/A", true, 4, report);
    addSectionInline(doc, "Staff Coordinator", report.staff_coordinator || "N/A", true, 5, report);

    /* ========== 6. BROCHURE/POSTER ========== */
    if (fileGroups["brochure"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`6. Brochure/Poster:`, doc.page.margins.left);
      doc.moveDown(0.4);

      for (const file of fileGroups["brochure"]) {
        console.log("Processing brochure file:", file.path); // ✅ Debug log
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "6. Brochure/Poster", "N/A", true, 6, report);
    }
    doc.moveDown(1);

    /* ========== 7. BRIEF SUMMARY ========== */
    doc.fontSize(10).font("Helvetica-Bold").text(`7. Brief Summary of the Activity/Event`, doc.page.margins.left);
    doc.moveDown(0.6);

    addSectionMultiLine(doc, "a. Objectives", report.activity_objectives || "N/A", 20, report, true);
    addSectionMultiLine(doc, "b. Description", report.activity_description || "N/A", 20, report, false);
    addSectionMultiLine(doc, "c. Outcomes", report.activity_outcomes || "N/A", 20, report, true);

    /* ========== 7d. ATTENDANCE ========== */
    if (fileGroups["attendance"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.moveDown(0.4);

      for (const file of fileGroups["attendance"]) {
        console.log("Processing attendance file:", file.path); // ✅ Debug log
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }
    doc.moveDown(0.8);

    /* ========== 8. GEO PHOTOS ========== */
    if (fileGroups["geo_photos"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`8. Geo tagged Photograph with Caption:`, doc.page.margins.left);
      doc.moveDown(0.4);

      for (const file of fileGroups["geo_photos"]) {
        console.log("Processing geo photo file:", file.path); // ✅ Debug log
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "8. Geo tagged Photograph with Caption", "N/A", true, 8, report);
    }

    /* ========== 9. CERTIFICATE ========== */
    if (fileGroups["certificate"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`9. Sample Certificate:`, doc.page.margins.left);
      doc.moveDown(0.4);

      for (const file of fileGroups["certificate"]) {
        console.log("Processing certificate file:", file.path); // ✅ Debug log
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "9. Sample Certificate", "N/A", true, 9, report);
    }

    addSignatureSection(doc, report);
    
    console.log("PDF generation complete, ending document"); // ✅ Debug log
    doc.end();

  } catch (err) {
    console.error("Sports PDF generation error:", err);
    console.error("Error stack:", err.stack); // ✅ Full error stack
    
    if (!res.headersSent) {
      res.status(500).send("PDF generation failed: " + err.message);
    } else {
      if (doc) doc.end();
    }
  }
};

export default generateSportsPDF;

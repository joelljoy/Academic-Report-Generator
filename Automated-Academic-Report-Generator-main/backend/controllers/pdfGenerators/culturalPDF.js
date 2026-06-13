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
const getCulturalReportData = (reportId) => {
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
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
};

/* ===================== PDF GENERATION ===================== */
export const generateCulturalPDF = async (req, res) => {
  let doc;
  try {
    const reportId = req.params.id;
    const rows = await getCulturalReportData(reportId);
    if (!rows || rows.length === 0) return res.status(404).send("Report not found");

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);

    doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 70, right: 50 },
      size: "A4",
      bufferPages: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=cultural_report_${reportId}.pdf`);
    doc.pipe(res);

    addPageHeader(doc, true, report);

    doc.fontSize(12).font("Helvetica-Bold").text("Report on CULTURAL", { align: "center" });
    doc.moveDown(0.8);

    addSectionInline(doc, "Name of the Department", report.department_name || "N/A", true, 0, report);

    addSectionInline(doc, "Name of the Activity/Event", report.activity_name || "N/A", true, 1, report);
    addSectionInline(doc, "Venue", report.venue || "N/A", true, 2, report);

    const formattedDate = formatReportDate(report.start_date, report.end_date);
    addSectionInline(doc, "Date and Duration", formattedDate || "N/A", true, 3, report);

    addSectionInline(doc, "Student Coordinator", report.student_coordinator || "N/A", true, 4, report);
    addSectionInline(doc, "Staff Coordinator", report.staff_coordinator || "N/A", true, 5, report);

    /* ✅ same file.path fix */
    if (fileGroups["brochure"]) {
      doc.fontSize(10).font("Helvetica-Bold").text(`6. Brochure/Poster :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["brochure"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Brochure/Poster", "N/A", true, 6, report);
    }
    doc.moveDown(1);

    doc.fontSize(10).font("Helvetica-Bold").text(`7. Brief Summary of the Activity/Event`, doc.page.margins.left);
    doc.moveDown(0.6);

    addSectionMultiLine(doc, "a. Objectives", report.activity_objectives || "N/A", 20, report, true);
    addSectionMultiLine(doc, "b. Description", report.activity_description || "N/A", 20, report, false);
    addSectionMultiLine(doc, "c. Outcomes", report.activity_outcomes || "N/A", 20, report, true);

    if (fileGroups["attendance"]) {
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.moveDown(0.4);
      for (const file of fileGroups["attendance"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }

    if (fileGroups["geo_photos"]) {
      doc.fontSize(10).font("Helvetica-Bold").text(`8. Geo tagged Photograph with Caption:`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["geo_photos"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Geo tagged Photograph with Caption", "N/A", true, 8, report);
    }

    if (fileGroups["certificate"]) {
      doc.fontSize(10).font("Helvetica-Bold").text(`9. Sample Certificate :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["certificate"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Sample Certificate", "N/A", true, 9, report);
    }

    addSignatureSection(doc, report);
    doc.end();

  } catch (err) {
    console.error("Cultural PDF generation error:", err);
    if (!res.headersSent) res.status(500).send("PDF generation failed: " + err.message);
    else if (doc) doc.end();
  }
};

export default generateCulturalPDF;


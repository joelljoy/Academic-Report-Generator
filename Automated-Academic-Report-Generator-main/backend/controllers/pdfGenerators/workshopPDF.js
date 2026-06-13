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
const getReportData = (reportId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT r.*,
             wd.nature_of_participants,
             wd.number_of_participants,
             rf.file_id, rf.file_category, rf.file_path, rf.caption
      FROM reports r
      LEFT JOIN workshop_details wd ON r.report_id = wd.report_id
      LEFT JOIN report_files rf ON r.report_id = rf.report_id
      WHERE r.report_id = ?
      ORDER BY rf.file_category, rf.file_id
      `,
      [reportId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

/* ===================== PDF GENERATION ===================== */
export const generateWorkshopPDF = async (req, res) => {
  let doc;

  try {
    const reportId = req.params.id;

    const rows = await getReportData(reportId);
    if (!rows || rows.length === 0) return res.status(404).send("Report not found");

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);

    doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 70, right: 50 },
      size: "A4",
      bufferPages: true
    });

    doc.on("error", (err) => {
      console.error("PDFKit Stream Error:", err);
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=report_${reportId}.pdf`);
    doc.pipe(res);

    /* HEADER */
    addPageHeader(doc, true, report);

    /* BASIC DETAILS */
    const leftMargin = doc.page.margins.left;
    const colonX = 250;
    const contentX = 265;
    const y = doc.y;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Name of Department / Committee", leftMargin, y, {
        width: colonX - leftMargin - 5
      });
    doc.text(" : ", colonX, y);
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(report.department_name || "N/A", contentX, y);

    doc.moveDown(0.8);

    addSectionInline(doc, "Name of the Activity / Event", report.activity_name || "N/A", true, 1, report);

    addSectionInline(
      doc,
      "Report Type",
      report.report_type ? report.report_type : "N/A",
      true,
      2,
      report
    );

    addSectionInline(doc, "Venue", report.venue || "N/A", true, 3, report);

    const formattedDate = formatReportDate(report.start_date, report.end_date);
    addSectionInline(doc, "Date (From - To)", formattedDate || "N/A", true, 4, report);

    addSectionInline(doc, "Nature of Participants", report.nature_of_participants || "N/A", true, 5, report);

    addSectionInline(
      doc,
      "Number of Participants",
      report.number_of_participants !== null && report.number_of_participants !== undefined
        ? String(report.number_of_participants)
        : "N/A",
      true,
      6,
      report
    );

    addSectionInline(doc, "Student Coordinator", report.student_coordinator || "N/A", true, 7, report);

    addSectionInline(doc, "Staff Coordinator", report.staff_coordinator || "N/A", true, 8, report);

    addSectionMultiLine(
      doc,
      "9. Details of Resource Person",
      report.details_of_resource_person || "N/A",
      0,
      report
    );

    /* ========== 10. BROCHURE ========== */
    if (fileGroups["brochure"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text("10. Brochure / Poster:", doc.page.margins.left);
      doc.moveDown(0.4);

      for (const file of fileGroups["brochure"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "10. Brochure / Poster", "N/A", true, 10, report);
    }

    doc.moveDown(1);

    /* ========== 11. BRIEF SUMMARY ========== */
    doc.fontSize(10).font("Helvetica-Bold").text("11. Brief Summary of the Activity / Event", doc.page.margins.left);
    doc.moveDown(0.6);

    addSectionMultiLine(doc, "a. Objectives", report.activity_objectives || "N/A", 20, report, true);
    addSectionMultiLine(doc, "b. Description", report.activity_description || "N/A", 20, report, false);
    addSectionMultiLine(doc, "c. Outcomes", report.activity_outcomes || "N/A", 20, report, true);

    /* ========== 11d. ATTENDANCE ========== */
    if (fileGroups["attendance"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.moveDown(0.4);

      for (const file of fileGroups["attendance"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }

    doc.moveDown(0.5);

    /* ========== 11e. FEEDBACK ========== */
    if (fileGroups["feedback"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("e. Sample Feedback with Summary:", doc.page.margins.left + 20);
      doc.moveDown(0.4);

      for (const file of fileGroups["feedback"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("e. Sample Feedback with Summary:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }

    doc.moveDown(0.5);

    /* ========== 12. IMPACT ANALYSIS ========== */
    addSectionMultiLine(
      doc,
      "12. Impact Analysis",
      report.activity_impact_analysis || "N/A",
      0,
      report
    );

    /* ========== 13. GEO TAGGED PHOTOS ========== */
    if (fileGroups["geo_photos"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("13. Geo-tagged Photographs with Caption:", doc.page.margins.left);

      doc.moveDown(0.4);

      for (const file of fileGroups["geo_photos"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "13. Geo-tagged Photographs with Caption", "N/A", true, 13, report);
    }

    /* ========== 14. CERTIFICATE ========== */
    if (fileGroups["certificate"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text("14. Sample Certificate:", doc.page.margins.left);
      doc.moveDown(0.4);

      for (const file of fileGroups["certificate"]) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "14. Sample Certificate", "N/A", true, 14, report);
    }

    /* SIGNATURE */
    addSignatureSection(doc, report);

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);

    if (!res.headersSent) {
      res.status(500).send("PDF generation failed: " + err.message);
    } else {
      if (doc) doc.end();
    }
  }
};

export default generateWorkshopPDF;

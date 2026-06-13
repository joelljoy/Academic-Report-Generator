import PDFDocument from "pdfkit";
import db from "../../config/db.js";
import {
  formatReportDate,
  addPageHeader,
  addSectionInline,
  addSectionMultiLine,
  addImageFromFile,
  groupFilesByCategory,
  addSignatureSection,
} from "../shared/pdfHelpers.js";

/* FETCH FDP DATA */
const getFdpData = (reportId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT r.*, rf.file_id, rf.file_category, rf.file_path, rf.caption
       FROM reports r
       LEFT JOIN report_files rf ON r.report_id = rf.report_id
       WHERE r.report_id = ?
       ORDER BY rf.file_category, rf.file_id`,
      [reportId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
};

export const generateFdpPDF = async (req, res, reportType = "FDP") => {
  let doc;
  try {
    const reportId = req.params.id;
    const rows = await getFdpData(reportId);
    if (!rows || rows.length === 0)
      return res.status(404).send("Report not found");

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);

    doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 70, right: 50 },
      size: "A4",
      bufferPages: true,
    });
    doc.on("error", (err) => console.error(err));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportType}_Report_${reportId}.pdf`  // ✅ Also fixing the reportType issue
    );
    doc.pipe(res);

    addPageHeader(doc, true, report);

    /* ===== BASIC DETAILS - USE addSectionInline ===== */
    addSectionInline(doc, "Department / Committee", report.department_name || "N/A", true, 1, report);
    addSectionInline(doc, "Activity Name", report.activity_name || "N/A", true, 2, report);
    addSectionInline(doc, "Venue", report.venue || "N/A", true, 3, report);
    
    const formattedDate = formatReportDate(report.start_date, report.end_date);
    addSectionInline(doc, "Date and Duration", formattedDate || "N/A", true, 4, report);

    doc.moveDown(0.5);

    /* ===== BROCHURE ===== */
    if (fileGroups["brochure"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text("5. Brochure / Poster:", doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["brochure"])
        await addImageFromFile(doc, file.path, file.caption, report);
    } else {
      addSectionInline(doc, "5. Brochure / Poster", "N/A", true, 5, report);
    }
    doc.moveDown(0.5);

    /* ===== PARTICIPANTS ===== */
    if (fileGroups["participants"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text("6. Participants List:", doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["participants"])
        await addImageFromFile(doc, file.path, file.caption, report);
    } else {
      addSectionInline(doc, "6. Participants List", "N/A", true, 6, report);
    }
    doc.moveDown(0.5);

    /* ===== ATTENDANCE ===== */
    if (fileGroups["attendance"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text("7. Attendance:", doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["attendance"])
        await addImageFromFile(doc, file.path, file.caption, report);
    } else {
      addSectionInline(doc, "7. Attendance", "N/A", true, 7, report);
    }
    doc.moveDown(0.5);

    /* ===== RESOURCE PERSONS ===== */
    addSectionMultiLine(
      doc,
      "8. Resource Persons Details",
      report.details_of_resource_person || "N/A",
      0,
      report
    );

    /* ===== BRIEF SUMMARY ===== */
    doc.fontSize(10).font("Helvetica-Bold").text("9. Brief Summary of the Activity / Event", doc.page.margins.left);
    doc.moveDown(0.6);
    addSectionMultiLine(doc, "a. Objectives", report.activity_objectives || "N/A", 20, report, true);
    addSectionMultiLine(doc, "b. Technical Description", report.activity_description || "N/A", 20, report, false);
    addSectionMultiLine(doc, "c. Outcomes", report.activity_outcomes || "N/A", 20, report, true);

    /* ===== FEEDBACK ===== */
    if (fileGroups["feedback"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("d. Feedback PDFs:", doc.page.margins.left + 20);
      doc.moveDown(0.4);
      for (const file of fileGroups["feedback"])
        await addImageFromFile(doc, file.path, file.caption, report);
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("d. Feedback PDFs:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }
    doc.moveDown(0.5);

    /* ===== IMPACT ANALYSIS ===== */
    addSectionMultiLine(
      doc,
      "10. Impact Analysis",
      report.activity_impact_analysis || "N/A",
      0,
      report
    );

    /* ===== GEO-PHOTOS ===== */
    if (fileGroups["geo_photos"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text("11. Geo-tagged Photographs with Caption:", doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["geo_photos"])
        await addImageFromFile(doc, file.path, file.caption, report);
    } else {
      addSectionInline(doc, "11. Geo-tagged Photographs with Caption", "N/A", true, 11, report);
    }

    /* ===== CERTIFICATE ===== */
    if (fileGroups["certificate"]) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text("12. Sample Certificate:", doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups["certificate"])
        await addImageFromFile(doc, file.path, file.caption, report);
    } else {
      addSectionInline(doc, "12. Sample Certificate", "N/A", true, 12, report);
    }

    addSignatureSection(doc, report);
    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent)
      res.status(500).send("PDF generation failed: " + err.message);
    else if (doc) doc.end();
  }
};


export default generateFdpPDF;

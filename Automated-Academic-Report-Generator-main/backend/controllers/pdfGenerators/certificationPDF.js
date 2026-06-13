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
             c.detailed_curriculum, c.assessment_details,
             rf.file_id, rf.file_category, rf.file_path, rf.caption
      FROM reports r
      LEFT JOIN certification_details c ON r.report_id = c.report_id
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
export const generateCertificationPDF = async (req, res) => {
  let doc;
  try {
    const reportId = req.params.id;
    const rows = await getReportData(reportId);
    if (!rows || rows.length === 0) return res.status(404).send("Report not found");

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);

    doc = new PDFDocument({ 
      margins: { top: 50, bottom: 50, left: 70, right: 50 },
      size: 'A4',
      bufferPages: true
    });

    doc.on('error', (err) => {
      console.error("PDFKit Stream Error:", err);
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=report_${reportId}.pdf`);
    doc.pipe(res);

    addPageHeader(doc, true, report);

    const leftMargin = doc.page.margins.left;
    const colonX = 250;
    const contentX = 265;
    const currentY = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text("Name of the Department", leftMargin, currentY, { width: colonX - leftMargin - 5 });
    doc.text(" : ", colonX, currentY);
    doc.font("Helvetica").fontSize(9).text(report.department_name || "N/A", contentX, currentY);
    doc.moveDown(0.8);

    addSectionInline(doc, "Name of the Activity/Event", report.activity_name || "N/A", true, 1, report);
    addSectionInline(doc, "Venue", report.venue, true, 2, report);
    const formattedDate = formatReportDate(report.start_date, report.end_date);
    addSectionInline(doc, "Date and Duration", formattedDate, true, 3, report);

    /* ========== 4. BROCHURE ========== */
    if (fileGroups['brochure']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`4. Brochure :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['brochure']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Brochure", "N/A", true, 4, report);
    }
    doc.moveDown(1);

    /* ========== 5. DETAILED CURRICULUM ========== */
    if (fileGroups['curriculum']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`5. Detailed Curriculum :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['curriculum']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Detailed Curriculum", "N/A", true, 5, report);
    }

    /* ========== 6. LIST OF STUDENTS ========== */
    if (fileGroups['students_list']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`6. List of Students Enrolled :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['students_list']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "List of Students Enrolled", "N/A", true, 6, report);
    }

    addSectionInline(doc, "Staff Coordinator", report.staff_coordinator, true, 7, report);
    addSectionMultiLine(doc, "8. Details of Resource Persons", report.details_of_resource_person, 0, report);

    /* ========== 9. BRIEF SUMMARY ========== */
    doc.fontSize(10).font("Helvetica-Bold").text(`9. Brief Summary of the Activity/Event`, doc.page.margins.left);
    doc.moveDown(0.6);

    addSectionMultiLine(doc, "a. Objectives", report.activity_objectives, 20, report, true);
    addSectionMultiLine(doc, "b. Technical Description", report.activity_description, 20, report, false);
    addSectionMultiLine(doc, "c. Outcomes", report.activity_outcomes, 20, report, true);

    /* ========== 9d. ATTENDANCE ========== */
    if (fileGroups['attendance']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.moveDown(0.4);
      for (const file of fileGroups['attendance']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Participants:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }
    doc.moveDown(0.5);

    /* ========== 9e. ASSESSMENT ========== */
    if (fileGroups['assessment']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("e. Assessment Details:", doc.page.margins.left + 20);
      doc.moveDown(0.4);
      for (const file of fileGroups['assessment']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("e. Assessment Details:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }
    doc.moveDown(0.5);

    /* ========== 9f. FEEDBACK ========== */
    if (fileGroups['feedback']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("f. Sample Feedback with Summary:", doc.page.margins.left + 20); 
      doc.moveDown(0.4);
      for (const file of fileGroups['feedback']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("f. Sample Feedback with Summary:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }
    doc.moveDown(0.5);

    addSectionMultiLine(doc, "g. Impact Analysis", report.activity_impact_analysis, 20, report, false);

    /* ========== 10. GEO PHOTOS ========== */
    if (fileGroups['geo_photos']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`10. Geo tagged Photographs with Caption:`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['geo_photos']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Geo tagged Photographs with Caption", "N/A", true, 10, report);
    }

    /* ========== 11. CERTIFICATE ========== */
    if (fileGroups['certificate']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`11. Sample Certificate :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['certificate']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Sample Certificate", "N/A", true, 11, report);
    }

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

export default generateCertificationPDF;
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
             o.number_of_beneficiaries, o.number_of_student_volunteers, 
             o.collaborating_agency,
             rf.file_id, rf.file_category, rf.file_path, rf.caption
      FROM reports r
      LEFT JOIN outreach_details o ON r.report_id = o.report_id
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
export const generateOutreachPDF = async (req, res) => {
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
      doc.fontSize(10).font("Helvetica-Bold").text(`4. Brochure / Newspaper Cutting :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['brochure']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Brochure / Newspaper Cutting", "N/A", true, 4, report);
    }
    doc.moveDown(1);

    addSectionInline(doc, "Number of Beneficiaries", report.number_of_beneficiaries?.toString() || "N/A", true, 5, report);
    addSectionInline(doc, "Number of Student Volunteers", report.number_of_student_volunteers?.toString() || "N/A", true, 6, report);
    addSectionInline(doc, "Student Coordinator", report.student_coordinator, true, 7, report);
    addSectionInline(doc, "Staff Coordinator", report.staff_coordinator, true, 8, report);
    addSectionInline(doc, "Collaborating Agency", report.collaborating_agency, true, 9, report);

    /* ========== 10. BRIEF SUMMARY ========== */
    doc.fontSize(10).font("Helvetica-Bold").text(`10. Brief Summary of the Activity/Event`, doc.page.margins.left);
    doc.moveDown(0.6);

    addSectionMultiLine(doc, "a. Objectives", report.activity_objectives, 20, report, true);
    addSectionMultiLine(doc, "b. Technical Description", report.activity_description, 20, report, false);
    addSectionMultiLine(doc, "c. Outcomes", report.activity_outcomes, 20, report, true);

    /* ========== 10d. ATTENDANCE ========== */
    if (fileGroups['attendance']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Student Volunteers:", doc.page.margins.left + 20);
      doc.moveDown(0.4);
      for (const file of fileGroups['attendance']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      doc.fontSize(9).font("Helvetica-Bold").text("d. Attendance of Student Volunteers:", doc.page.margins.left + 20);
      doc.font("Helvetica").fontSize(9).text("N/A", doc.page.margins.left + 35);
    }
    doc.moveDown(0.5);

    addSectionMultiLine(doc, "e. Impact Analysis", report.activity_impact_analysis, 20, report, false);

    /* ========== 11. GEO PHOTOS ========== */
    if (fileGroups['geo_photos']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`11. Geo tagged Photographs:`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['geo_photos']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Geo tagged Photographs", "N/A", true, 11, report);
    }

    /* ========== 12. CERTIFICATE ========== */
    if (fileGroups['certificate']) {
      if (doc.page.height - doc.page.margins.bottom - doc.y < 350) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      doc.fontSize(10).font("Helvetica-Bold").text(`12. Sample Certificate :`, doc.page.margins.left);
      doc.moveDown(0.4);
      for (const file of fileGroups['certificate']) {
        await addImageFromFile(doc, file.path, file.caption, report);
      }
    } else {
      addSectionInline(doc, "Sample Certificate", "N/A", true, 12, report);
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

export default generateOutreachPDF;
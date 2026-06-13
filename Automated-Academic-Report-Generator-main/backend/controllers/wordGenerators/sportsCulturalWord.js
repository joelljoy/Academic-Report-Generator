import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import db from "../../config/db.js";
import { 
  createWordFileSection, 
  formatReportDate, 
  groupFilesByCategory,
  createFieldRow,
  createBoldSection,
  createSubSectionMultiLine,
  createSubSectionMultiLineNoBullets,
  createWordHeaderForAllPages
} from "../shared/wordHelpers.js";

/* ===================== FETCH DATA ===================== */
const getReportData = (reportId) => {
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

/* ===================== WORD GENERATION ===================== */
export const generateSportsCulturalWord = async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log("Generating Sports/Cultural Word for report ID:", reportId);
    
    const rows = await getReportData(reportId);
    
    if (!rows || rows.length === 0) {
      return res.status(404).send("Report not found");
    }

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);
    console.log("File groups:", Object.keys(fileGroups));

    // Determine title based on report_type (SPORTS or CULTURAL)
    const reportTypeLabel = report.report_type === "SPORTS"
      ? "Sports Activity/Event"
      : "Cultural Activity/Event";

    // Build document sections
    const sections = [
      // Title - Single, larger black text (matching certification)
      new Paragraph({
        children: [
          new TextRun({ text: `Report on ${reportTypeLabel}`, bold: true, size: 32 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      // Basic Details
      createFieldRow("1. Name of the Activity/Event", report.activity_name),
      createFieldRow("2. Venue", report.venue),
      createFieldRow("3. Date and Duration", formatReportDate(report.start_date, report.end_date)),
      createFieldRow("4. Number of Students Participated", report.number_of_students?.toString()),
      createFieldRow("5. Student Coordinator", report.student_coordinator),
      createFieldRow("6. Staff Coordinator", report.staff_coordinator),
    ];

    // Brochure
    sections.push(...await createWordFileSection("7. Brochure / Poster", fileGroups['brochure']));

    // Section 8 - Bold heading
    sections.push(createBoldSection("8. Brief Summary of the Activity/Event"));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("a. Objectives", report.activity_objectives, true));
    
    // Without bullets (plain paragraph)
    sections.push(...createSubSectionMultiLineNoBullets("b. Description", report.activity_description, true));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("c. Outcomes", report.activity_outcomes, true));

    // Attendance
    sections.push(...await createWordFileSection("d. Attendance of Participants", fileGroups['attendance'], true));

    // Geo Photos
    sections.push(...await createWordFileSection("9. Geo tagged Photographs with Caption", fileGroups['geo_photos']));

    // Certificate
    sections.push(...await createWordFileSection("10. Sample Certificate", fileGroups['certificate']));

    // ✅ SIGNATURE BLOCK — moves only if it doesn't fit (matching certification)
    sections.push(
      // Spacer before signatures
      new Paragraph({
        text: "",
        spacing: { before: 800 },
        keepNext: true
      }),

      // Labels
      new Paragraph({
        children: [
          new TextRun({ text: "Staff Coordinator", bold: true, size: 22 }),
          new TextRun({ text: "\t\t\t\t\t\t\t", size: 22 }),
          new TextRun({ text: "HOD", bold: true, size: 22 })
        ],
        spacing: { after: 100 },
        keepLines: true,
        keepNext: true
      }),

      // Signature lines
      // new Paragraph({
      //   children: [
      //     new TextRun({ text: "___________________________", size: 22 }),
      //     new TextRun({ text: "\t\t\t", size: 22 }),
      //     new TextRun({ text: "___________________________", size: 22 })
      //   ],
      //   keepLines: true
      // })
    );

    // Create document with header on all pages (matching certification)
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1800,  // Increased top margin to accommodate header
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        headers: createWordHeaderForAllPages(),  // Header on all pages
        children: sections
      }]
    });

    // Generate buffer
    console.log("Generating Word buffer...");
    const buffer = await Packer.toBuffer(doc);
    console.log("Word document generated successfully");

    // Send response
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=sportscultural_report_${reportId}.docx`);
    res.send(buffer);

  } catch (err) {
    console.error("Word generation error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).send("Word generation failed: " + err.message);
  }
};

export default generateSportsCulturalWord;

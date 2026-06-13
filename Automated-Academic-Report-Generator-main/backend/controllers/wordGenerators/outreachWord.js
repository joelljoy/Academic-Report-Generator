import { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign } from "docx";
import db from "../../config/db.js";
import { 
  createWordFileSection, 
  formatReportDate, 
  groupFilesByCategory,
  createFieldRow,
  createBoldSection,
  createSubSection,
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

/* ===================== WORD GENERATION ===================== */
export const generateOutreachWord = async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log("Generating Outreach Word for report ID:", reportId);
    
    const rows = await getReportData(reportId);
    
    if (!rows || rows.length === 0) {
      return res.status(404).send("Report not found");
    }

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);
    console.log("File groups:", Object.keys(fileGroups));

    // Build document sections
    const sections = [
      // Title - Single, larger black text
      new Paragraph({
        children: [
          new TextRun({ text: "Report on Outreach Activity", bold: true, size: 32 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      // Basic Details
      createFieldRow("Name of the Department / Institute Level Committee", report.department_name),
      createFieldRow("1. Name of the Activity/Event", report.activity_name),
      createFieldRow("2. Venue", report.venue),
      createFieldRow("3. Date and Duration", formatReportDate(report.start_date, report.end_date)),
      createFieldRow("4. Number of Beneficiaries", report.number_of_beneficiaries?.toString()),
      createFieldRow("5. Number of Student Volunteers", report.number_of_student_volunteers?.toString()),
    ];

    // Brochure/Newspaper Cutting
    sections.push(...await createWordFileSection("6. Brochure/Newspaper Cutting", fileGroups['brochure']));

    // Coordinators
    sections.push(createFieldRow("7. Student Coordinator", report.student_coordinator));
    sections.push(createFieldRow("8. Staff Coordinator", report.staff_coordinator));
    sections.push(createFieldRow("9. Collaborating Agency", report.collaborating_agency));

    // Section 10 - Bold (not blue heading)
    sections.push(createBoldSection("10. Brief Summary of the Activity/Event"));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("a. Objectives", report.activity_objectives, true));
    
    // Without bullets (plain paragraph)
    sections.push(...createSubSectionMultiLineNoBullets("b. Technical Description", report.activity_description, true));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("c. Outcomes", report.activity_outcomes, true));
    
    sections.push(...await createWordFileSection("d. Attendance of Student Volunteers", fileGroups['attendance'], true));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("e. Impact Analysis", report.activity_impact_analysis, true));

    // Geo Photos
    sections.push(...await createWordFileSection("11. Geo tagged Photographs with Caption", fileGroups['geo_photos']));

    // Certificate
    sections.push(...await createWordFileSection("12. Sample Certificate", fileGroups['certificate']));

    // ✅ SIGNATURE BLOCK
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
      })
    );

    // Create document with header on all pages
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
    res.setHeader("Content-Disposition", `attachment; filename=outreach_report_${reportId}.docx`);
    res.send(buffer);

  } catch (err) {
    console.error("Word generation error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).send("Word generation failed: " + err.message);
  }
};

export default generateOutreachWord;
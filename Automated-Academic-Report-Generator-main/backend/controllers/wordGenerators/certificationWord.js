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
  createSubSectionMultiLineNoBullets,  // ← Add this import
  createWordHeaderForAllPages
} from "../shared/wordHelpers.js";

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

/* ===================== WORD GENERATION ===================== */
export const generateCertificationWord = async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log("Generating Certification Word for report ID:", reportId);
    
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
          new TextRun({ text: "Report on Certification Course", bold: true, size: 32 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      // Basic Details
      createFieldRow("Name of the Department", report.department_name),
      createFieldRow("1. Name of the Activity/Event", report.activity_name),
      createFieldRow("2. Venue", report.venue),
      createFieldRow("3. Date and Duration", formatReportDate(report.start_date, report.end_date)),
    ];

    // Files with images embedded
    sections.push(...await createWordFileSection("4. Brochure", fileGroups['brochure']));
    sections.push(...await createWordFileSection("5. Detailed Curriculum", fileGroups['curriculum']));
    sections.push(...await createWordFileSection("6. List of Students Enrolled", fileGroups['students_list']));

    // Coordinator
    sections.push(createFieldRow("7. Staff Coordinator", report.staff_coordinator));

    // Resource Persons
    // sections.push(new Paragraph({
    //   children: [
    //     new TextRun({ text: "8. Details of Resource Persons: ", bold: true, size: 22 }),
    //     new TextRun({ text: report.details_of_resource_person || "N/A", size: 22 })
    //   ],
    //   spacing: { after: 300 }
    // }));
    // Resource Persons - ✅ CHANGED TO MULTI-LINE FORMAT
    sections.push(...createSubSectionMultiLineNoBullets("8. Details of Resource Persons", report.details_of_resource_person));

    // Section 9 - Bold (not blue heading)
    sections.push(createBoldSection("9. Brief Summary of the Activity/Event"));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("a. Objectives", report.activity_objectives, true));
    
    // Without bullets (plain paragraph)
    sections.push(...createSubSectionMultiLineNoBullets("b. Technical Description", report.activity_description, true));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("c. Outcomes", report.activity_outcomes, true));
    
    sections.push(...await createWordFileSection("d. Attendance of Participants", fileGroups['attendance'], true));
    sections.push(...await createWordFileSection("e. Assessment Details", fileGroups['assessment'], true));
    sections.push(...await createWordFileSection("f. Sample Feedback with Summary", fileGroups['feedback'], true));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("g. Impact Analysis", report.activity_impact_analysis, true));

    // Geo Photos
    sections.push(...await createWordFileSection("10. Geo tagged Photographs with Caption", fileGroups['geo_photos']));

    // Certificate
    sections.push(...await createWordFileSection("11. Sample Certificate", fileGroups['certificate']));

    // ✅ SIGNATURE AT THE END OF CONTENT (NOT IN FOOTER)
// ✅ SIGNATURE BLOCK — moves only if it doesn't fit
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
    res.setHeader("Content-Disposition", `attachment; filename=certification_report_${reportId}.docx`);
    res.send(buffer);

  } catch (err) {
    console.error("Word generation error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).send("Word generation failed: " + err.message);
  }
};

export default generateCertificationWord;
//fine
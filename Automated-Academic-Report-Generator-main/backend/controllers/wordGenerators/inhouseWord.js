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
          ih.nature_of_participants, 
          ih.number_of_participants,        
          rf.file_id, rf.file_category, rf.file_path, rf.caption
    FROM reports r
    LEFT JOIN inhouse_details ih ON r.report_id = ih.report_id
    LEFT JOIN report_files rf ON r.report_id = rf.report_id
    WHERE r.report_id = ?
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
export const generateInHouseWord = async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log("Generating InHouse Word for report ID:", reportId);
    
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
          new TextRun({ text: "Report on In-House Activity", bold: true, size: 32 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      // Basic Details
      createFieldRow("Name of the Department / Institute Level Committee", report.department_name),
      createFieldRow("1. Name of the Activity/Event", report.activity_name),
      createFieldRow("2. Venue", report.venue),
      createFieldRow("3. Date and Duration", formatReportDate(report.start_date, report.end_date)),
      createFieldRow("4. Nature of Participants", report.nature_of_participants),
      createFieldRow("5. Number of Participants", report.number_of_participants?.toString()),
    ];

    // Brochure
    sections.push(...await createWordFileSection("6. Brochure/Poster", fileGroups['brochure']));

    // Coordinator
    sections.push(createFieldRow("7. Student/Staff Coordinator", report.staff_coordinator));

    // Section 8 - Bold (not blue heading)
    sections.push(createBoldSection("8. Brief Summary of the Activity/Event"));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("a. Objectives", report.activity_objectives, true));
    
    // Without bullets (plain paragraph)
    sections.push(...createSubSectionMultiLineNoBullets("b. Technical Description", report.activity_description, true));
    
    // With bullets
    sections.push(...createSubSectionMultiLine("c. Outcomes", report.activity_outcomes, true));
    
    sections.push(...await createWordFileSection("d. Attendance of Participants", fileGroups['attendance'], true));

    // Geo Photos
    sections.push(...await createWordFileSection("9. Geo tagged Photographs with Caption", fileGroups['geo_photos']));

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
    res.setHeader("Content-Disposition", `attachment; filename=inhouse_report_${reportId}.docx`);
    res.send(buffer);

  } catch (err) {
    console.error("Word generation error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).send("Word generation failed: " + err.message);
  }
};

export default generateInHouseWord;
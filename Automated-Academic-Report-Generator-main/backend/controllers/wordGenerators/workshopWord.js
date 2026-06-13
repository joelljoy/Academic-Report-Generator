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
             wd.nature_of_participants,
             wd.number_of_participants,
             rf.file_id, rf.file_category, rf.file_path, rf.caption
      FROM reports r
      LEFT JOIN workshop_details wd ON r.report_id = wd.report_id
      LEFT JOIN report_files rf ON r.report_id = rf.report_id
      WHERE r.report_id = ?
        AND r.report_type = 'WORKSHOP'
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
export const generateWorkshopWord = async (req, res) => {
  try {
    const reportId = req.params.id;

    const rows = await getReportData(reportId);
    if (!rows || rows.length === 0) {
      return res.status(404).send("Workshop report not found");
    }

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);

    const sections = [
      new Paragraph({
        children: [new TextRun({ text: "Report on Workshop", bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      createFieldRow("Name of the Department / Institute Level Committee", report.department_name),
      createFieldRow("1. Name of the Activity/Event", report.activity_name),
      createFieldRow("2. Venue", report.venue),
      createFieldRow("3. Date and Duration", formatReportDate(report.start_date, report.end_date)),
      createFieldRow("4. Nature of Participants", report.nature_of_participants),
      createFieldRow("5. Number of Participants", report.number_of_participants?.toString()),
    ];

    sections.push(...await createWordFileSection("6. Brochure / Poster", fileGroups['brochure']));
    sections.push(createFieldRow("7. Student Coordinator", report.student_coordinator));
    sections.push(createFieldRow("8. Staff Coordinator", report.staff_coordinator));

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: "9. Details of Resource Person: ", bold: true, size: 22 }),
          new TextRun({ text: report.details_of_resource_person || "N/A", size: 22 })
        ],
        spacing: { after: 300 }
      })
    );

    sections.push(createBoldSection("10. Brief Summary of the Activity/Event"));
    sections.push(...createSubSectionMultiLine("a. Objectives", report.activity_objectives, true));
    sections.push(...createSubSectionMultiLineNoBullets("b. Description", report.activity_description, true));
    sections.push(...createSubSectionMultiLine("c. Outcomes", report.activity_outcomes, true));
    sections.push(...await createWordFileSection("d. Attendance of Participants", fileGroups['attendance'], true));
    sections.push(...await createWordFileSection("e. Sample Feedback with Summary", fileGroups['feedback'], true));
    sections.push(...createSubSectionMultiLine("f. Impact Analysis", report.activity_impact_analysis, true));
    sections.push(...await createWordFileSection("11. Geo tagged Photographs with Caption", fileGroups['geo_photos']));
    sections.push(...await createWordFileSection("12. Sample Certificate", fileGroups['certificate']));

    sections.push(
      new Paragraph({ text: "", spacing: { before: 800 }, keepNext: true }),
      new Paragraph({
        children: [
          new TextRun({ text: "Staff Coordinator", bold: true, size: 22 }),
          new TextRun({ text: "\t\t\t\t\t\t\t", size: 22 }),
          new TextRun({ text: "HOD", bold: true, size: 22 })
        ],
        keepNext: true
      }),
      // new Paragraph({
      //   children: [
      //     new TextRun({ text: "___________________________", size: 22 }),
      //     new TextRun({ text: "\t\t\t", size: 22 }),
      //     new TextRun({ text: "___________________________", size: 22 })
      //   ]
      // })
    );

    const doc = new Document({
      sections: [{
        headers: createWordHeaderForAllPages(),
        children: sections
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Disposition", `attachment; filename=workshop_report_${reportId}.docx`);
    res.send(buffer);

  } catch (err) {
    res.status(500).send(err.message);
  }
};

export default generateWorkshopWord;

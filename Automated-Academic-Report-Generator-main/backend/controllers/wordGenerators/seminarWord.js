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
             sd.nature_of_participants,
             sd.number_of_participants,
             rf.file_id, rf.file_category, rf.file_path, rf.caption
      FROM reports r
      LEFT JOIN seminar_details sd ON r.report_id = sd.report_id
      LEFT JOIN report_files rf ON r.report_id = rf.report_id
      WHERE r.report_id = ?
        AND r.report_type = 'SEMINAR'
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
export const generateSeminarWord = async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log("Generating Seminar Word for report ID:", reportId);

    const rows = await getReportData(reportId);

    if (!rows || rows.length === 0) {
      return res.status(404).send("Seminar report not found");
    }

    const report = rows[0];
    const fileGroups = groupFilesByCategory(rows);

    /* ===================== DOCUMENT SECTIONS ===================== */
    const sections = [
      // Title
      new Paragraph({
        children: [
          new TextRun({ text: "Report on Seminar", bold: true, size: 32 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      // Basic Details
      createFieldRow(
        "Name of the Department / Institute Level Committee",
        report.department_name
      ),
      createFieldRow("1. Name of the Activity/Event", report.activity_name),
      createFieldRow("2. Venue", report.venue),
      createFieldRow(
        "3. Date and Duration",
        formatReportDate(report.start_date, report.end_date)
      ),
      createFieldRow(
        "4. Nature of Participants",
        report.nature_of_participants
      ),
      createFieldRow(
        "5. Number of Participants",
        report.number_of_participants?.toString()
      )
    ];

    /* ===================== FILE SECTIONS ===================== */
    sections.push(
      ...await createWordFileSection(
        "6. Brochure / Poster",
        fileGroups["brochure"]
      )
    );

    /* ===================== COORDINATORS ===================== */
    sections.push(
      createFieldRow("7. Student Coordinator", report.student_coordinator)
    );
    sections.push(
      createFieldRow("8. Staff Coordinator", report.staff_coordinator)
    );

    /* ===================== RESOURCE PERSON ===================== */
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "9. Details of Resource Person: ",
            bold: true,
            size: 22
          }),
          new TextRun({
            text: report.details_of_resource_person || "N/A",
            size: 22
          })
        ],
        spacing: { after: 300 }
      })
    );

    /* ===================== SUMMARY ===================== */
    sections.push(
      createBoldSection("10. Brief Summary of the Activity/Event")
    );

    sections.push(
      ...createSubSectionMultiLine(
        "a. Objectives",
        report.activity_objectives,
        true
      )
    );

    sections.push(
      ...createSubSectionMultiLineNoBullets(
        "b. Description",
        report.activity_description,
        true
      )
    );

    sections.push(
      ...createSubSectionMultiLine(
        "c. Outcomes",
        report.activity_outcomes,
        true
      )
    );

    sections.push(
      ...await createWordFileSection(
        "d. Attendance of Participants",
        fileGroups["attendance"],
        true
      )
    );

    sections.push(
      ...await createWordFileSection(
        "e. Sample Feedback with Summary",
        fileGroups["feedback"],
        true
      )
    );

    sections.push(
      ...createSubSectionMultiLine(
        "f. Impact Analysis",
        report.activity_impact_analysis,
        true
      )
    );

    /* ===================== PHOTOS & CERTIFICATE ===================== */
    sections.push(
      ...await createWordFileSection(
        "11. Geo tagged Photographs with Caption",
        fileGroups["geo_photos"]
      )
    );

    sections.push(
      ...await createWordFileSection(
        "12. Sample Certificate",
        fileGroups["certificate"]
      )
    );

    /* ===================== SIGNATURE BLOCK ===================== */
    sections.push(
      new Paragraph({
        text: "",
        spacing: { before: 800 },
        keepNext: true
      }),

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

      // new Paragraph({
      //   children: [
      //     new TextRun({ text: "___________________________", size: 22 }),
      //     new TextRun({ text: "\t\t\t", size: 22 }),
      //     new TextRun({ text: "___________________________", size: 22 })
      //   ],
      //   keepLines: true
      // })
    );

    /* ===================== DOCUMENT ===================== */
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1800,
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          },
          headers: createWordHeaderForAllPages(),
          children: sections
        }
      ]
    });

    /* ===================== SEND FILE ===================== */
    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=seminar_report_${reportId}.docx`
    );
    res.send(buffer);

  } catch (err) {
    console.error("Seminar Word generation error:", err);
    res.status(500).send("Word generation failed: " + err.message);
  }
};

export default generateSeminarWord;

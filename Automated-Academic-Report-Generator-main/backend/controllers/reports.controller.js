import db from "../config/db.js";

const cleanText = (text) => {
  if (!text) return null;
  return text
    .replace(/Ð/g, '') // Remove Ð
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const createReport = (req, res) => {
  const data = req.body;
  const files = req.files;

  /* 1️⃣ INSERT INTO reports */
  const reportQuery = `
    INSERT INTO reports (
      report_type,
      activity_name,
      venue,
      start_date,
      end_date,
      staff_coordinator,
      student_coordinator,
      activity_objectives,
      activity_description,
      activity_outcomes,
      activity_impact_analysis,
      details_of_resource_person,
      department_name
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const reportValues = [
    data.report_type,
    cleanText(data.activity_name),                      // ✅ CLEAN
    cleanText(data.venue),                              // ✅ CLEAN
    data.start_date,
    data.end_date,
    cleanText(data.staff_coordinator),                  // ✅ CLEAN
    cleanText(data.student_coordinator) || null,        // ✅ CLEAN
    cleanText(data.activity_objectives),                // ✅ CLEAN
    cleanText(data.activity_description),               // ✅ CLEAN
    cleanText(data.activity_outcomes),                  // ✅ CLEAN
    cleanText(data.activity_impact_analysis) || null,   // ✅ CLEAN
    cleanText(data.details_of_resource_person) || null, // ✅ CLEAN
    cleanText(data.department_name) || null             // ✅ CLEAN
  ];

  db.query(reportQuery, reportValues, (err, result) => {
    if (err) {
      console.error("REPORT ERROR:", err);
      return res.status(500).json(err);
    }

    const reportId = result.insertId;

    /* 2️⃣ CHILD TABLE INSERT */
    if (data.report_type === "CERTIFICATION") {
      db.query(
        `INSERT INTO certification_details
         (report_id, detailed_curriculum, assessment_details)
         VALUES (?,?,?)`,
        [
          reportId,
          null,      
          null        
        ]
      );
    }

    if (data.report_type === "WORKSHOP") {
      db.query(
        `INSERT INTO workshop_details
         (report_id, nature_of_participants, number_of_participants)
         VALUES (?,?,?)`,
        [
          reportId,
          cleanText(data.nature_of_participants)||null,
          cleanText(data.number_of_participants)||null
        ]
      );
    }

    if (data.report_type === "SEMINAR") {
      db.query(
        `INSERT INTO seminar_details
         (report_id, nature_of_participants, number_of_participants)
         VALUES (?,?,?)`,
        [
          reportId,
          cleanText(data.nature_of_participants)||null,
          cleanText(data.number_of_participants)||null
        ]
      );
    }

    if (data.report_type === "INHOUSE") {
      db.query(
        `INSERT INTO inhouse_details
         (report_id, nature_of_participants, number_of_participants)
         VALUES (?,?,?)`,
        [
          reportId,
          data.nature_of_participants,
          data.number_of_participants
        ]
      );
    }

    if (data.report_type === "OUTREACH") {
      db.query(
        `INSERT INTO outreach_details
         (report_id, number_of_beneficiaries, number_of_student_volunteers, collaborating_agency)
         VALUES (?,?,?,?)`,
        [
          reportId,
          cleanText(data.number_of_beneficiaries),
          cleanText(data.number_of_student_volunteers),
          cleanText(data.collaborating_agency)
        ]
      );
    }

    /* 3️⃣ FILES - FIXED TO HANDLE MULTIPLE FILES WITH CAPTIONS */
    if (files && files.length > 0) {
      // Group files by fieldname to match captions correctly
      const filesByCategory = {};
      
      files.forEach((file) => {
        if (!filesByCategory[file.fieldname]) {
          filesByCategory[file.fieldname] = [];
        }
        filesByCategory[file.fieldname].push(file);
      });

      // Process each category
      Object.keys(filesByCategory).forEach((fieldname) => {
        const categoryFiles = filesByCategory[fieldname];
        const captionsKey = `caption_${fieldname}`;
        
        // Get captions array for this category
        let captions = data[captionsKey];
        
        // Ensure captions is an array
        if (!Array.isArray(captions)) {
          captions = captions ? [captions] : [];
        }

        // Insert each file with its corresponding caption
        categoryFiles.forEach((file, index) => {
          const caption = cleanText(captions[index]) || null;
          
          db.query(
            `INSERT INTO report_files
             (report_id, file_category, file_path, caption, uploaded_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
              reportId,
              file.fieldname,
              file.path,
              caption
            ],
            (err) => {
              if (err) {
                console.error("File insert error:", err);
              }
            }
          );
        });
      });
    }

    res.json({
      message: "Report saved successfully",
      report_id: reportId
    });
  });
};
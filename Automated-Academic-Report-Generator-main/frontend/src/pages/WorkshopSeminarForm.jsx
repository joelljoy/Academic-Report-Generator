import { useState } from "react";
import "../styles/form-styles.css";
import PdfWithCaptionSection from "./PdfWithCaptionSection";

export default function WorkshopSeminarForm() {
  const [brochures, setBrochures] = useState([{ file: null, caption: "" }]);
  const [attendance, setAttendance] = useState([{ file: null, caption: "" }]);
  const [geoPhotos, setGeoPhotos] = useState([{ file: null, caption: "" }]);
  const [feedbackFiles, setFeedbackFiles] = useState([null]);

  // ✅ FIX: savedReportId state added (this was missing)
  const [savedReportId, setSavedReportId] = useState(null);

  const addFeedback = () => setFeedbackFiles([...feedbackFiles, null]);

  /* ================= SUBMIT HANDLER ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData();

    /* MAIN REPORT TABLE */
    formData.append("report_type", form.report_type.value);
    formData.append("department_name", form.department_name.value);
    formData.append("activity_name", form.activity_name.value);
    formData.append("venue", form.venue.value);
    formData.append("start_date", form.start_date.value);
    formData.append("end_date", form.end_date.value);
    formData.append("nature_of_participants", form.nature_of_participants.value);
    formData.append("number_of_participants", form.number_of_participants.value);
    formData.append("student_coordinator", form.student_coordinator.value);
    formData.append("staff_coordinator", form.staff_coordinator.value);
    formData.append(
      "details_of_resource_person",
      form.details_of_resource_person.value
    );

    /* SUMMARY */
    formData.append("activity_objectives", form.activity_objectives.value);
    formData.append("activity_description", form.activity_description.value);
    formData.append("activity_outcomes", form.activity_outcomes.value);
    formData.append("activity_impact_analysis", form.activity_impact_analysis.value);

    /* FILE HANDLER */
    const appendFiles = (items, field) => {
      items.forEach((item) => {
        if (item.file) {
          formData.append(field, item.file);
          formData.append(`caption_${field}`, item.caption);
        }
      });
    };

    appendFiles(brochures, "brochure");
    appendFiles(attendance, "attendance");
    appendFiles(geoPhotos, "geo_photos");

    feedbackFiles.forEach((file) => {
      if (file) formData.append("feedback", file);
    });

    if (form.certificate.files[0]) {
      formData.append("certificate", form.certificate.files[0]);
    }

    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Failed to save report");

      // ✅ FIX: backend should return report_id, so we store it
      // Example backend response should be: { report_id: 12, message: "saved" }
      const data = await res.json();

      // Support multiple possible keys to prevent crash
      const id = data?.report_id || data?.id || data?.insertId;

      if (!id) {
        alert("Saved ✅ but Report ID not received from backend");
      } else {
        setSavedReportId(id);
        alert("Workshop / Seminar report saved successfully ✅");
      }

      // Reset HTML form
      form.reset();

      // Reset React file inputs states (important!)
      setBrochures([{ file: null, caption: "" }]);
      setAttendance([{ file: null, caption: "" }]);
      setGeoPhotos([{ file: null, caption: "" }]);
      setFeedbackFiles([null]);

    } catch (err) {
      console.error(err);
      alert("Error saving workshop/seminar report ❌");
    }
  };
  /* ================================================= */

  return (
    <form className="fdp-form" onSubmit={handleSubmit}>
      {/* BASIC DETAILS */}
      <section className="form-section">
        <h3>Basic Details</h3>
        <div className="form-grid">
          <label>Name of Department / Institute Level Committee</label>
          <input name="department_name" type="text" />

          <label>Name of the Activity / Event</label>
          <input
            name="activity_name"
            type="text"
            placeholder="Seminar / Workshop on ..."
          />

          <label>Report Type</label>
          <select name="report_type" required>
            <option value="">Select</option>
            <option value="SEMINAR">Seminar</option>
            <option value="WORKSHOP">Workshop</option>
          </select>

          <label>Venue</label>
          <input name="venue" type="text" />

          <label>Date (From)</label>
          <input name="start_date" type="date" />

          <label>Date (To)</label>
          <input name="end_date" type="date" />

          <label>Nature of Participants</label>
          <input name="nature_of_participants" type="text" />

          <label>Number of Participants</label>
          <input name="number_of_participants" type="number" min="0" />

          <label>Student Coordinator</label>
          <input name="student_coordinator" type="text" />

          <label>Staff Coordinator</label>
          <input name="staff_coordinator" type="text" />

          <label>Details of Resource Person</label>
          <textarea name="details_of_resource_person" rows="3" />
        </div>
      </section>

      {/* BROCHURE */}
      <PdfWithCaptionSection
        title="Brochure / Poster (PDF)"
        items={brochures}
        setItems={setBrochures}
      />

      {/* SUMMARY */}
      <section className="form-section">
        <h3>Brief Summary of the Activity / Event</h3>
        <div className="form-grid">
          <label>Objectives</label>
          <textarea name="activity_objectives" rows="3" />

          <label>Description</label>
          <textarea name="activity_description" rows="4" />

          <label>Outcomes</label>
          <textarea name="activity_outcomes" rows="3" />
        </div>
      </section>

      {/* ATTENDANCE */}
      <PdfWithCaptionSection
        title="Attendance of Participants (PDF)"
        items={attendance}
        setItems={setAttendance}
      />

      {/* FEEDBACK */}
      <section className="form-section">
        <h3>Sample Feedback with Summary (PDF)</h3>

        {feedbackFiles.map((_, index) => (
          <div className="form-grid" key={index}>
            <label>Upload Feedback</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const copy = [...feedbackFiles];
                copy[index] = e.target.files?.[0] || null;
                setFeedbackFiles(copy);
              }}
            />
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addFeedback}>
          + Add More Feedback PDFs
        </button>
      </section>

      {/* IMPACT */}
      <section className="form-section">
        <h3>Impact Analysis</h3>
        <div className="form-grid">
          <label>Impact Analysis Description</label>
          <textarea name="activity_impact_analysis" rows="4" />
        </div>
      </section>

      {/* GEO TAGGED */}
      <PdfWithCaptionSection
        title="Geo-tagged Photographs (PDF)"
        items={geoPhotos}
        setItems={setGeoPhotos}
      />

      {/* CERTIFICATE */}
      <section className="form-section">
        <h3>Sample Certificate (PDF)</h3>
        <div className="form-grid">
          <label>Upload Certificate</label>
          <input name="certificate" type="file" accept="application/pdf" />
        </div>
      </section>

      {/* SAVE */}
      <section className="form-section">
        <button type="submit" className="submit-btn">
          Save Form
        </button>
      </section>

      {/* ✅ DOWNLOAD PDF SECTION */}
  {savedReportId && (
    <section className="form-section">
      <h3>Download Report</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="submit-btn"
          onClick={() =>
            window.open(
              `http://localhost:5000/api/reports/${savedReportId}/pdf`,
              "_blank"
            )
          }
        >
          📄 Download PDF
        </button>
        
        <button
          type="button"
          className="submit-btn"
          onClick={() =>
            window.open(
              `http://localhost:5000/api/reports/${savedReportId}/word`,
              "_blank"
            )
          }
        >
          📝 Download Word
        </button>
      </div>
    </section>
  )}
    </form>
  );
}

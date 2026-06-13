import { useState } from "react";
import "../styles/form-styles.css";
import PdfWithCaptionSection from "./PdfWithCaptionSection";

export default function InHouseForm() {
  // State standardized as arrays of objects for all file sections
  const [brochures, setBrochures] = useState([{ file: null, caption: "" }]);
  const [attendance, setAttendance] = useState([{ file: null, caption: "" }]);
  const [geoPhotos, setGeoPhotos] = useState([{ file: null, caption: "" }]);
  
  const [savedReportId, setSavedReportId] = useState(null);

  /* ================= SUBMIT HANDLER ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    /* MAIN REPORT TABLE DATA */
    formData.append("report_type", "INHOUSE");
    formData.append("department_name", form.department_name.value);
    formData.append("activity_name", form.activity_name.value);
    formData.append("venue", form.venue.value);
    formData.append("start_date", form.start_date.value);
    formData.append("end_date", form.end_date.value);
    formData.append("nature_of_participants", form.nature_of_participants.value);
    formData.append("number_of_participants", form.number_of_participants.value);
    formData.append("staff_coordinator", form.staff_coordinator.value);
    formData.append("activity_objectives", form.activity_objectives.value);
    formData.append("activity_description", form.activity_description.value);
    formData.append("activity_outcomes", form.activity_outcomes.value);

    /* UNIFIED FILE HANDLER */
    const appendFiles = (items, field) => {
      items.forEach((item) => {
        if (item.file) {
          formData.append(field, item.file);
          formData.append(`caption_${field}`, item.caption || ""); 
        }
      });
    };

    appendFiles(brochures, "brochure");
    appendFiles(attendance, "attendance");
    appendFiles(geoPhotos, "geo_photos");

    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save report");
      const data = await res.json();
      setSavedReportId(data.report_id);
      alert("Inhouse report saved successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Error saving inhouse report ❌");
    }
  };

  return (
    <form className="fdp-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <h3>Activity Details</h3>
        <div className="form-grid">
          <label>Name of Department / Institute Level Committee</label>
          <input type="text" name="department_name" required />

          <label>Name of the Activity / Event</label>
          <input name="activity_name" type="text" required />

          <label>Report Type</label>
          <input type="text" name="report_type" value="INHOUSE" readOnly />

          <label>Venue</label>
          <input name="venue" type="text" required />

          <label>Date (From)</label>
          <input name="start_date" type="date" required />

          <label>Date (To)</label>
          <input name="end_date" type="date" required />

          <label>Nature of Participants</label>
          <input name="nature_of_participants" type="text" required />

          <label>Number of Participants</label>
          <input name="number_of_participants" type="number" required />

          <label>Student / Staff Coordinator</label>
          <textarea name="staff_coordinator" rows="2" required />
        </div>
      </section>

      <PdfWithCaptionSection title="Brochure / Poster (PDF)" items={brochures} setItems={setBrochures} />

      <section className="form-section">
        <h3>Brief Summary of the Activity</h3>
        <div className="form-grid">
          <label>Objectives</label>
          <textarea name="activity_objectives" rows="3" />

          <label>Technical Description</label>
          <textarea name="activity_description" rows="4" />

          <label>Outcomes</label>
          <textarea name="activity_outcomes" rows="3" />
        </div>
      </section>

      <PdfWithCaptionSection title="Attendance of Participants (PDF)" items={attendance} setItems={setAttendance} />

      <PdfWithCaptionSection title="Geo-tagged Photographs (PDF)" items={geoPhotos} setItems={setGeoPhotos} />

      <section className="form-section">
        <button type="submit" className="submit-btn">Save Form</button>
      </section>

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
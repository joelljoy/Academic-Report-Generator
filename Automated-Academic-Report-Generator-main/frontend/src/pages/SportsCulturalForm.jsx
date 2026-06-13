import { useState } from "react";
import "../styles/form-styles.css";
import PdfWithCaptionSection from "./PdfWithCaptionSection";

export default function SportsCulturalForm() {
  const [brochures, setBrochures] = useState([{ file: null, caption: "" }]);
  const [attendance, setAttendance] = useState([{ file: null, caption: "" }]);
  const [geoPhotos, setGeoPhotos] = useState([{ file: null, caption: "" }]);
  const [savedReportId, setSavedReportId] = useState(null);

  /* ================= SUBMIT HANDLER ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    /* REPORTS TABLE */
    formData.append("report_type", form.report_type.value); // SPORTS / CULTURAL
    formData.append("activity_name", form.activity_name.value);
    formData.append("venue", form.venue.value);
    formData.append("start_date", form.start_date.value);
    formData.append("end_date", form.end_date.value);
    formData.append("staff_coordinator", form.staff_coordinator.value);
    formData.append("student_coordinator", form.student_coordinator.value);

    formData.append("activity_objectives", form.objectives.value);
    formData.append("activity_description", form.description.value);
    formData.append("activity_outcomes", form.outcomes.value);

    /* FILE HANDLER */
    const appendFiles = (items, category) => {
      items.forEach((item) => {
        if (item.file) {
          formData.append(category, item.file); // 👈 category as fieldname
          formData.append(`caption_${category}`, item.caption);
        }
      });
    };

    appendFiles(brochures, "brochure");
    appendFiles(attendance, "attendance");
    appendFiles(geoPhotos, "geo_photos");

    if (form.certificate.files[0]) {
      formData.append("certificate", form.certificate.files[0]);
    }

    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      setSavedReportId(data.report_id);
      alert("Sports / Cultural report saved successfully ✅");
      form.reset();

    } catch (err) {
      console.error(err);
      alert("Error saving Sports / Cultural report ❌");
    }
  };
  /* ================================================= */

  return (
    <form className="fdp-form" onSubmit={handleSubmit}>
      {/* BASIC DETAILS */}
      <section className="form-section">
        <h3>Basic Details</h3>
        <div className="form-grid">
          <label>Name of the Activity / Event</label>
          <input name="activity_name" type="text" />

          <label>Report Type</label>
          <select name="report_type" required>
            <option value="">Select</option>
            <option value="SPORTS">Sports</option>
            <option value="CULTURAL">Cultural</option>
          </select>

          <label>Venue</label>
          <input name="venue" type="text" />

          <label>Date (From)</label>
          <input name="start_date" type="date" />

          <label>Date (To)</label>
          <input name="end_date" type="date" />

          <label>Number of Students Participated</label>
          <input type="number" min="0" />

          <label>Student Coordinator</label>
          <input name="student_coordinator" type="text" />

          <label>Staff Coordinator</label>
          <input name="staff_coordinator" type="text" />
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
          <textarea name="objectives" rows="3" />

          <label>Description</label>
          <textarea name="description" rows="4" />

          <label>Outcomes</label>
          <textarea name="outcomes" rows="3" />
        </div>
      </section>

      {/* ATTENDANCE */}
      <PdfWithCaptionSection
        title="Attendance of Participants (PDF)"
        items={attendance}
        setItems={setAttendance}
      />

      {/* GEO PHOTOS */}
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

      {/* DOWNLOAD */}
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

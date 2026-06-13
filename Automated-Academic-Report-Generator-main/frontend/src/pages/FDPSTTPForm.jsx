import { useState } from "react";
import "../styles/form-styles.css";
import PdfWithCaptionSection from "./PdfWithCaptionSection";

export default function FDPSTTPForm() {
  /* ================= STATES ================= */
  const [brochures, setBrochures] = useState([{ file: null, caption: "" }]);
  const [participants, setParticipants] = useState([
    { file: null, caption: "" },
  ]);
  const [attendance, setAttendance] = useState([{ file: null, caption: "" }]);
  const [geoPhotos, setGeoPhotos] = useState([{ file: null, caption: "" }]);
  const [feedbackPDFs, setFeedbackPDFs] = useState([
    { file: null, caption: "" },
  ]);
  const [savedReportId, setSavedReportId] = useState(null);

  const addFeedback = () =>
    setFeedbackPDFs([...feedbackPDFs, { file: null, caption: "" }]);

  /* ================= SUBMIT HANDLER ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    /* ===== REPORT TABLE DATA ===== */
    formData.append("report_type", form.report_type.value);
    formData.append("department_name", form.department_name.value);
    formData.append("activity_name", form.activity_name.value);
    formData.append("venue", form.venue.value);
    formData.append("start_date", form.start_date.value);
    formData.append("end_date", form.end_date.value);
    formData.append("staff_coordinator", form.staff_coordinator.value);
    formData.append(
      "details_of_resource_person",
      form.details_of_resource_person.value
    );
    formData.append("activity_objectives", form.activity_objectives.value);
    formData.append("activity_description", form.activity_description.value);
    formData.append("activity_outcomes", form.activity_outcomes.value);
    formData.append(
      "activity_impact_analysis",
      form.activity_impact_analysis.value
    );

    /* ===== FILE HANDLER ===== */
    const appendFiles = (items, field) => {
      items.forEach((item) => {
        if (item.file) {
          formData.append(field, item.file);
          formData.append(`caption_${field}`, item.caption || "");
        }
      });
    };

    appendFiles(brochures, "brochure");
    appendFiles(participants, "participants");
    appendFiles(attendance, "attendance");
    appendFiles(geoPhotos, "geo_photos");
    appendFiles(feedbackPDFs, "feedback");

    /* ===== CERTIFICATE (OPTIONAL) ===== */
    if (form.certificate?.files[0]) {
      formData.append("certificate", form.certificate.files[0]);
    }

    /* ===== SUBMIT TO BACKEND ===== */
    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save report");

      const data = await res.json(); // expects { report_id: ... } from backend
      setSavedReportId(data.report_id);

      alert("FDP / STTP report saved successfully ✅");
      form.reset(); // reset after setting savedReportId
    } catch (err) {
      console.error(err);
      alert("Error saving FDP / STTP report ❌");
    }
  };

  /* ================= RENDER ================= */
  return (
    <form className="fdp-form" onSubmit={handleSubmit}>
      {/* BASIC DETAILS */}
      <section className="form-section">
        <h3>Basic Details</h3>
        <div className="form-grid">
          <label>Name of Department / Institute Level Committee</label>
          <input name="department_name" type="text" required />

          <label>Name of Activity / Event</label>
          <input name="activity_name" type="text" required />

          <label>Report Type</label>
          <select name="report_type" required>
            <option value="">Select</option>
            <option value="FDP">FDP</option>
            <option value="STTP">STTP</option>
          </select>

          <label>Venue</label>
          <input name="venue" type="text" required />

          <label>Date (From)</label>
          <input name="start_date" type="date" required />

          <label>Date (To)</label>
          <input name="end_date" type="date" required />

          <label>Staff Coordinator(s)</label>
          <textarea name="staff_coordinator" rows="2" required />

          <label>Resource Persons Details</label>
          <textarea name="details_of_resource_person" rows="3" required />
        </div>
      </section>

      {/* PDF SECTIONS */}
      <PdfWithCaptionSection
        title="Brochure (PDF)"
        items={brochures}
        setItems={setBrochures}
      />
      <PdfWithCaptionSection
        title="List of Participants (PDF)"
        items={participants}
        setItems={setParticipants}
      />
      <PdfWithCaptionSection
        title="Attendance of Participants (PDF)"
        items={attendance}
        setItems={setAttendance}
      />
      <PdfWithCaptionSection
        title="Geo-tagged Photographs (PDF)"
        items={geoPhotos}
        setItems={setGeoPhotos}
      />

      {/* SUMMARY */}
      <section className="form-section">
        <h3>Brief Summary</h3>
        <div className="form-grid">
          <label>Objectives</label>
          <textarea name="activity_objectives" rows="3" />

          <label>Technical Description</label>
          <textarea name="activity_description" rows="4" />

          <label>Outcomes</label>
          <textarea name="activity_outcomes" rows="3" />
        </div>
      </section>

      {/* FEEDBACK — PDF ONLY */}
      <section className="form-section">
        <h3>Feedback Summary (PDF)</h3>
        {feedbackPDFs.map((item, index) => (
          <div className="form-grid" key={index}>
            <label>Upload Feedback PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const copy = [...feedbackPDFs];
                copy[index] = { file: e.target.files[0], caption: "" };
                setFeedbackPDFs(copy);
              }}
            />
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addFeedback}>
          + Add More
        </button>
      </section>

      {/* IMPACT */}
      <section className="form-section">
        <h3>Impact Analysis</h3>
        <div className="form-grid">
          <label>Impact Description</label>
          <textarea name="activity_impact_analysis" rows="4" />
        </div>
      </section>

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

      {/* DOWNLOAD PDF BUTTON */}
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

import FDPSTTPForm from "../pages/FDPSTTPForm";
import SportsCulturalForm from "../pages/SportsCulturalForm";
import InhouseForm from "../pages/InhouseForm";
import OutreachForm from "../pages/OutreachForm";
import WorkshopSeminarForm from "../pages/WorkshopSeminarForm";
import CertificationForm from "../pages/CertificationForm";

export default function FormLayout({ title }) {
  return (
    <div className={`form-card ${!title ? "empty-form" : ""}`}>
      
      {/* NO TAB SELECTED */}
      {!title ? (
        <div className="empty-form-message">
          <h2>Select a report type</h2>
          <p>Please select a tab above to fill the corresponding report form.</p>
        </div>
      ) : (
        <>
          <h2>{title}</h2>

          {/* FDP / STTP FORM */}
          {title === "FDP / STTP Report" && <FDPSTTPForm />}

          {/* SPORTS / CULTURAL FORM */}
          {title === "Sports / Cultural Activity Report" && (
            <SportsCulturalForm />
          )}
          {/* In-house FORM */}
          {title === "In-house Activity Report" && (
            <InhouseForm />
          )}
          {/* Outreach Program FORM */}
          {title === "Outreach Program Report" && (
            <OutreachForm />
          )}
          {/* Workshop / Seminar FORM */}
          {title === "Workshop / Seminar Report" && (
            <WorkshopSeminarForm />
          )}
          {/* Certification Program FORM */}
          {title === "Certification Program Report" && (
            <CertificationForm />
          )}

        </>
      )}
    </div>
  );
}

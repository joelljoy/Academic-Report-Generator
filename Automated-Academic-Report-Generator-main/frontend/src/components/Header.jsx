import logo from "../images/logo.png";

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="logo-container">
          {/* Ensure you have the logo file in your public/assets folder */}
          <img src={logo} alt="FCRIT Logo" className="header-logo" />
        </div>
        
        <div className="header-text-content">
          <p className="org-name">AGNEL CHARITIES</p>
          <h1 className="institute-name">FR. C. RODRIGUES INSTITUTE OF TECHNOLOGY</h1>
          <p className="location-info">
            Agnel Technical Education Complex Sector 9-A, Vashi, Navi Mumbai, Maharashtra, India PIN - 400703
          </p>
          <p className="affiliation-info">
            (An Autonomous Institute & Permanently Affiliated To University Of Mumbai)
          </p>
        </div>
      </div>
    </header>
  );
}
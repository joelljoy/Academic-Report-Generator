import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Contact Section */}
          <div className="footer-section contact-info">
            <h2>Fr. C. Rodrigues Institute of Technology</h2>
            <address>
              Agnel Technical Education Complex<br />
              Sector 9-A, Vashi, Navi Mumbai,<br />
              Maharashtra, India<br />
              PIN - 400703
            </address>
            <div className="contact-details">
              <p>📞 (022) 27661924 , 27660619, 27660714, 27660715</p>
              <p>📠 (022) 27660619</p>
              <p>✉️ principal@fcrit.ac.in</p>
            </div>
            <div className="timings">
              <strong>Timings:</strong><br />
              10.00 AM - 1.00 PM<br />
              1.30 PM - 5.00 PM<br />
              Working Saturday - 1st and 3rd
            </div>
          </div>

          {/* Map and Social Section */}
          <div className="footer-section map-social">
            <div className="map-placeholder">
  <iframe
    title="FCRIT Map Location"
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.671877735571!2d72.98784097981956!3d19.07546518710301!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7d0d2f70ee137%3A0x3e59b715c04b357c!2sFr.%20C.%20Rodrigues%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
    style={{ border: 0 }}
    allowFullScreen=""
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
</div>

            <div className="social-links">
              <a href="#" className="social-icon facebook">f</a>
              <a href="#" className="social-icon instagram"></a>
              <a href="#" className="social-icon linkedin">in</a>
              <a href="#" className="social-icon youtube">▶</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>©FCRIT, Vashi. All rights reserved.</p>
          <p className="browser-note">This website is best viewed in Chrome and Mozilla Firefox in 1366x768 screen resolution.</p>
          <p>Developer Team</p>
        </div>
      </div>
    </footer>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-col">
          <h3 style={{ background: 'linear-gradient(to right, var(--primary-accent), var(--tertiary-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem' }}>
            ✈️ SmartTransport
          </h3>
          <p>
            An advanced routing application dedicated to providing optimized travel paths globally and within India.
            Harnessing graph theory algorithms to save you time and money.
          </p>
        </div>
        <div className="footer-col">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/destinations">Destinations</Link>
          <Link to="/user-dashboard">Book Travel</Link>
        </div>
        <div className="footer-col">
          <h3>Company</h3>
          <Link to="#">About Us</Link>
          <Link to="#">Careers</Link>
          <Link to="#">Partners</Link>
        </div>
        <div className="footer-col">
          <h3>Support</h3>
          <Link to="#">Help Center</Link>
          <Link to="#">Terms of Service</Link>
          <Link to="#">Privacy Policy</Link>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} SmartTransport Global Inc. All rights reserved. Professional Project Setup.
      </div>
    </footer>
  );
}

export default Footer;

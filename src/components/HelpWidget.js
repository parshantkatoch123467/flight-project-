import React, { useState } from 'react';

function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="help-widget">
      {isOpen && (
        <div className="glass-panel help-panel">
          <h4>💬 How can we assist you?</h4>
          <ul>
            <li>
              <strong>📍 Destinations:</strong>
              Check out all available cities, nearest stations, and flights in the Destinations tab.
            </li>
            <li>
              <strong>💵 Budget Optimizer:</strong>
              In the Travel Booking tab, check the Knapsack toggle to see how many places you can visit under your budget!
            </li>
            <li>
              <strong>🗺️ Path Selection:</strong>
              Dijkstra algorithm calculates either the cheapest or the fastest route depending on your selection.
            </li>
            <li>
              <strong>👤 Admin Panel:</strong>
              View live analytics, booking sales, and minimum spanning trees for network maintenance.
            </li>
          </ul>
        </div>
      )}
      <button className="help-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : 'ℹ️'}
      </button>
    </div>
  );
}

export default HelpWidget;

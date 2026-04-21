import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Destinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/routes/destination-info')
      .then(res => res.json())
      .then(data => {
        setDestinations(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load destinations. Ensure backend is running.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '5rem' }}>Loading global destinations...</div>;
  if (error) return <div className="dashboard-container" style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</div>;

  return (
    <div className="dashboard-container">
      <div style={{ textAlign: 'center', marginBottom: '4rem', animation: 'slideUp 0.6s ease' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--primary-accent), var(--tertiary-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Explore the World
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>
          Discover our supported nodes globally and within India. See available airports, train stations, and minimum routing costs.
        </p>
      </div>

      <div className="grid-3">
        {destinations.map((dest, i) => (
          <div key={dest.id} className="glass-panel dest-card" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both', animationName: 'fadeUp', animationDuration: '0.6s' }}>
            <div className="dest-img-container">
              <img src={dest.imageUrl} alt={dest.name} className="dest-img" loading="lazy" />
              <div className="dest-gradient"></div>
              <div style={{ position: 'absolute', bottom: '15px', left: '20px', zIndex: 10 }}>
                <h2 style={{ fontSize: '1.8rem', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{dest.name}</h2>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{dest.country}</div>
              </div>
            </div>
            
            <div className="dest-content">
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {dest.description}
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Connections via Air</div>
                <div className="dest-badges">
                  {dest.flightsAvailableFrom.length > 0 ? 
                    dest.flightsAvailableFrom.slice(0, 3).map(f => <span key={'f'+f} className="badge">✈️ from {f}</span>) 
                    : <span className="badge" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>No direct flights</span>
                  }
                  {dest.flightsAvailableFrom.length > 3 && <span className="badge">+{dest.flightsAvailableFrom.length - 3} more</span>}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Connections via Train</div>
                <div className="dest-badges">
                  {dest.trainsAvailableFrom.length > 0 ? 
                    dest.trainsAvailableFrom.slice(0, 3).map(t => <span key={'t'+t} className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--secondary-accent)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>🚆 from {t}</span>) 
                    : <span className="badge" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>No direct trains</span>
                  }
                  {dest.trainsAvailableFrom.length > 3 && <span className="badge">+{dest.trainsAvailableFrom.length - 3} more</span>}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Min Estimated Cost</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                    {dest.minKnownCost ? `$${dest.minKnownCost}` : 'N/A'}
                  </div>
                </div>
                <button className="cta-button" onClick={() => navigate(`/?dest=${encodeURIComponent(dest.name)}`)} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>Plan Route</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Destinations;

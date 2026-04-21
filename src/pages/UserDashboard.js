import React, { useState } from 'react';
import MapView from '../components/MapView';

function UserDashboard() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [budgetMode, setBudgetMode] = useState(false);
  const [budget, setBudget] = useState(1000);
  const [bookingStatus, setBookingStatus] = useState(null);

  const handleBook = async () => {
    if (!result || result.type !== 'route' || !result.data.shortestPath) return;
    setBookingStatus('Processing...');
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/routes/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          path: result.data.shortestPath.pathNodes,
          totalPrice: result.data.shortestPath.totalCost
        })
      });
      if (res.ok) {
        setBookingStatus('Booked Successfully!');
      } else {
        setBookingStatus('Failed to book.');
      }
    } catch (err) {
      setBookingStatus('Error connecting to server.');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBookingStatus(null);
    try {
      if (budgetMode) {
        const res = await fetch(`http://localhost:5000/api/routes/budget-optimizer?source=${source}&budget=${budget}`);
        const data = await res.json();
        if (res.ok) {
          setResult({ type: 'budget', data });
        } else {
          setError(data.message || 'Error fetching data');
        }
      } else {
        const res = await fetch(`http://localhost:5000/api/routes/search?source=${source}&destination=${destination}&sortBy=${sortBy}`);
        const data = await res.json();
        if (res.ok) {
          setResult({ type: 'route', data });
        } else {
          setError(data.message || 'Error fetching data');
        }
      }
    } catch (err) {
      setError('Network connection failed. Ensure backend is running.');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Search Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-accent)' }}>
            {budgetMode ? 'Knapsack Budget Optimizer' : 'Travel Booking Interface'}
          </h2>

          <div style={{ marginBottom: '1rem' }}>
             <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
               <input 
                 type="checkbox" 
                 checked={budgetMode} 
                 onChange={(e) => setBudgetMode(e.target.checked)} 
                 style={{ marginRight: '0.5rem' }}
               />
               <span style={{ color: 'var(--text-muted)' }}>Enable Budget Optimization (Knapsack)</span>
             </label>
          </div>

          <div className="form-group">
            <label>Origin Hub</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Mumbai, Tokyo" 
              value={source} 
              onChange={(e) => setSource(e.target.value)} 
            />
          </div>

          {!budgetMode && (
            <>
              <div className="form-group">
                <label>Arrival Hub</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Delhi, London" 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Algorithm Weight Target</label>
                <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price">Cheapest Overall Path (Price)</option>
                  <option value="duration">Fastest Overall Path (Duration)</option>
                </select>
              </div>
            </>
          )}

          {budgetMode && (
             <div className="form-group">
               <label>Maximum Affordability ($)</label>
               <input 
                 type="number" 
                 className="form-control" 
                 value={budget} 
                 onChange={(e) => setBudget(Number(e.target.value))} 
               />
             </div>
          )}

          <button onClick={handleSearch} className="cta-button" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing Traversal...' : 'Generate Route'}
          </button>

          {error && <div style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</div>}
        </div>

        {/* Results Panel */}
        <div className="glass-panel" style={{ padding: '2rem', overflowY: 'auto', maxHeight: '500px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-accent)' }}>Itinerary Logs</h2>
          
          {!result && <p style={{ color: 'var(--text-muted)' }}>Query outputs will render here.</p>}

          {result && result.type === 'route' && result.data.shortestPath && (
            <div>
               <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                  Primary Optimal Path 
               </h3>
               <div className="route-card glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <div className="route-header">
                     <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{result.data.shortestPath.pathNodes.join(' ➔ ')}</span>
                     <span className="route-price">${result.data.shortestPath.totalCost}</span>
                  </div>
                  {result.data.shortestPath.segments.map((seg, i) => (
                    <div key={i} style={{ marginBottom: '1rem', borderLeft: '2px solid var(--primary-accent)', paddingLeft: '1rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                         <strong style={{ color: 'var(--primary-accent)' }}>{seg.source} ➔ {seg.destination}</strong>
                         <span>${seg.price}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                         <span>{seg.company} ({seg.transportType.toUpperCase()})</span>
                         <span>{seg.duration} min</span>
                       </div>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                         Schedule: {seg.departureTime} - {seg.arrivalTime}
                       </div>
                    </div>
                  ))}
                  <button 
                    className="cta-button" 
                    onClick={handleBook}
                    disabled={bookingStatus !== null}
                    style={{ width: '100%', marginTop: '1rem', background: bookingStatus === 'Booked Successfully!' ? 'var(--text-muted)' : 'var(--success)' }}>
                    {bookingStatus || 'Confirm & Secure Booking'}
                  </button>
               </div>
            </div>
          )}

          {result && result.type === 'budget' && (
             <div>
                <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                  Budget Friendly Destinations
               </h3>
               <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                 Based on max budget of ${result.data.budget}, you can afford:
               </p>
               {result.data.canVisit.map((v, i) => (
                  <div key={i} className="route-card glass-panel">
                    <div className="route-header" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                      <span style={{ fontWeight: 'bold' }}>➔ {v.id}</span>
                      <span className="route-price" style={{ fontSize: '1.2rem' }}>${v.cost}</span>
                    </div>
                  </div>
               ))}
               {!result.data.canVisit.length && <p>Budget too low for any transit options.</p>}
             </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ height: '500px', overflow: 'hidden' }}>
        {/* We pass the array of coordinates directly from the backend into MapView! */}
        <MapView routeData={result?.type === 'route' ? result.data.shortestPath.segments : null} />
      </div>

    </div>
  );
}

export default UserDashboard;

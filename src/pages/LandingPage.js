import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapView from '../components/MapView';

// Haversine formula calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const initialDest = queryParams.get('dest') || '';

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState(initialDest);
  const [locating, setLocating] = useState(false);
  const [transportType, setTransportType] = useState('any');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('cheapest'); // cheapest, fastest, shortest
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);

  useEffect(() => {
    // Fetch mocks
    fetch('http://localhost:5000/api/routes/ai-suggestion')
      .then(res => res.json())
      .then(data => setAiSuggestion(data))
      .catch(() => {});
      
    fetch('http://localhost:5000/api/routes/weather-impact')
      .then(res => res.json())
      .then(data => setWeatherAlerts(data.globalDisruptions || []))
      .catch(() => {});
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const res = await fetch('http://localhost:5000/api/routes/locations');
        const locs = await res.json();
        let nearest = null;
        let minDist = Infinity;
        locs.forEach(l => {
          const dist = calculateDistance(position.coords.latitude, position.coords.longitude, l.lat, l.lng);
          if (dist < minDist) { minDist = dist; nearest = l.name; }
        });
        if (nearest) setSource(nearest);
      } catch (e) {
        alert("Failed to fetch hubs for location snapping.");
      }
      setLocating(false);
    }, () => {
      alert('Unable to retrieve your location. Check permissions.');
      setLocating(false);
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!source || !destination) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:5000/api/routes/search?source=${source}&destination=${destination}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (data.cheapestPath) setActiveTab('cheapest');
      } else {
        setError(data.message || 'Error fetching routes');
      }
    } catch (err) {
      setError('Network connection failed.');
    }
    setLoading(false);
  };

  const handleBook = () => { navigate('/user-dashboard'); };

  // Filter segments based on transport filter (Client-side simple example)
  const getRenderPath = () => {
    if (!result) return null;
    let pathObj = result.cheapestPath;
    if (activeTab === 'fastest') pathObj = result.fastestPath;
    if (activeTab === 'shortest') pathObj = result.shortestPath;
    
    if (!pathObj) return null;
    
    if (transportType !== 'any') {
      const allMatch = pathObj.segments.every(s => s.transportType === transportType);
      if (!allMatch) return { error: `This optimized path requires mixed transport or different mode.` };
    }
    return pathObj;
  };

  return (
    <div style={{ animation: 'fadeIn 0.8s ease' }}>
      <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', padding: '4rem 1rem' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(rgba(4, 13, 33, 0.6), rgba(15, 23, 42, 1)), url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -1 }}></div>
        
        {/* Alerts Overlay */}
        <div style={{ position: 'absolute', top: '100px', right: '30px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
           {weatherAlerts.length > 0 && (
             <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.1)', textAlign: 'left' }}>
               <strong style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>⚠️ Global Weather Alerts</strong>
               {weatherAlerts.map((w, i) => (
                 <div key={i} style={{ fontSize: '0.8rem', color: '#fff', marginTop: '0.3rem' }}>{w.location}: {w.type} (Delay x{w.delayFactor})</div>
               ))}
             </div>
           )}
           {aiSuggestion && (
             <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--primary-accent)', background: 'rgba(99, 102, 241, 0.1)', textAlign: 'left' }}>
               <strong style={{ color: 'var(--primary-accent)', fontSize: '0.9rem' }}>🤖 AI Suggestion ({aiSuggestion.confidence})</strong>
               <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.3rem', lineHeight: '1.4' }}>{aiSuggestion.message}</div>
             </div>
           )}
        </div>

        <div style={{ maxWidth: '900px', padding: '2rem', animation: 'slideUp 0.8s ease', zIndex: 10 }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: '700', marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.1' }}>
            The World at Your Fingertips.
          </h1>
          <p style={{ fontSize: '1.3rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '750px', margin: '0 auto 3rem auto' }}>
             Intelligent algorithmic routing empowers your domestic & worldwide travel planning. Select your path and visualize real-time multi-criteria efficiency.
          </p>

          <form onSubmit={handleSearch} className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem', borderRadius: '24px', maxWidth: '900px', margin: '0 auto', background: 'rgba(15, 23, 42, 0.55)', alignItems: 'center' }}>
             <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <input type="text" placeholder="Origin Hub (e.g. Mumbai)" className="form-control" style={{ width: '100%', borderRadius: '16px', paddingRight: '40px' }} value={source} onChange={e => setSource(e.target.value)} required />
                <button type="button" onClick={handleLocateMe} title="Auto-detect nearest hub" disabled={locating} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem', opacity: locating ? 0.5 : 1 }}>📍</button>
             </div>
             
             <input type="text" placeholder="Destination Hub (e.g. Tokyo)" className="form-control" style={{ flex: '1 1 200px', borderRadius: '16px' }} value={destination} onChange={e => setDestination(e.target.value)} required />
             
             <select className="form-control" style={{ flex: '0 1 150px', borderRadius: '16px', color: '#fff' }} value={transportType} onChange={e => setTransportType(e.target.value)}>
                <option value="any">Any Mode</option>
                <option value="flight">Flight Only</option>
                <option value="train">Train Only</option>
             </select>

             <button type="submit" className="cta-button" style={{ borderRadius: '16px', padding: '1rem 2rem', flex: '0 1 auto', whiteSpace: 'nowrap' }} disabled={loading}>
                {loading ? 'Routing...' : 'Search Route'}
             </button>
          </form>
          {error && <div style={{ color: 'var(--danger)', marginTop: '1rem', fontWeight: 'bold' }}>{error}</div>}
        </div>

        {/* Results & Map Section */}
        {result && (
          <div style={{ width: '100%', maxWidth: '1200px', display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: '2rem', marginTop: '3rem', zIndex: 10, animation: 'fadeIn 0.6s ease', textAlign: 'left' }}>
            
            <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '550px', display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                  <button onClick={() => setActiveTab('cheapest')} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: activeTab === 'cheapest' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: activeTab === 'cheapest' ? '#10b981' : '#fff', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>
                    Cheapest<br/><span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Dijkstra (Cost)</span>
                  </button>
                  <button onClick={() => setActiveTab('fastest')} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: activeTab === 'fastest' ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: activeTab === 'fastest' ? '#38bdf8' : '#fff', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>
                    Fastest<br/><span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Dijkstra (Time)</span>
                  </button>
                  <button onClick={() => setActiveTab('shortest')} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: activeTab === 'shortest' ? 'rgba(168, 85, 247, 0.2)' : 'transparent', color: activeTab === 'shortest' ? '#a855f7' : '#fff', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>
                    Shortest<br/><span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>A* Geo-Dist</span>
                  </button>
               </div>
               
               <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                 {(() => {
                    const currentPath = getRenderPath();
                    if (!currentPath) return <p style={{ color: 'var(--text-muted)' }}>No path found for this criteria.</p>;
                    if (currentPath.error) return <p style={{ color: 'var(--danger)' }}>{currentPath.error}</p>;

                    return (
                      <div className="route-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div className="route-header" style={{ marginBottom: '1.5rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>{currentPath.pathNodes.join(' ➔ ')}</span>
                          <div style={{ textAlign: 'right' }}>
                             <div className="route-price" style={{ fontSize: '1.8rem', color: activeTab === 'cheapest' ? '#10b981' : '#fff' }}>${currentPath.totalCost}</div>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{currentPath.totalDuration} minutes</div>
                             {currentPath.actualKmCost && <div style={{ color: '#a855f7', fontSize: '0.8rem' }}>Geo-Heuristic Dist: {currentPath.actualKmCost}</div>}
                          </div>
                        </div>
                        
                        {currentPath.segments.map((seg, i) => (
                          <div key={i} style={{ marginBottom: '1.2rem', paddingLeft: '1rem', borderLeft: `3px solid ${seg.transportType === 'flight' ? '#38bdf8' : '#10b981'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', fontWeight: '500', marginBottom: '0.3rem' }}>
                              <span>{seg.source} ➔ {seg.destination}</span>
                              <span>${seg.price}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>
                                {seg.transportType === 'flight' ? '✈️' : '🚆'}
                              </span>
                              <span>{seg.company} • {seg.duration}m</span>
                            </div>
                          </div>
                        ))}
                        
                        <button className="cta-button" onClick={handleBook} style={{ width: '100%', marginTop: '1rem', borderRadius: '12px' }}>
                          Proceed to Booking
                        </button>
                      </div>
                    );
                 })()}
               </div>
            </div>

            <div className="glass-panel" style={{ height: '550px', overflow: 'hidden', padding: 0 }}>
               <MapView routeData={getRenderPath() && !getRenderPath().error ? getRenderPath().segments : null} />
            </div>

          </div>
        )}
      </section>
      
       {/* Details Section Footer */}
      <section style={{ padding: '6rem 4rem', background: '#05080c' }}>
         {/* Retained from old system */}
         <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
           <h2 style={{ fontSize: '3rem', background: 'linear-gradient(to right, #a855f7, var(--tertiary-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>Next-Generation Travel Architecture</h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Enterprise-grade algorithmic tools available for every traveler.</p>
         </div>
         <div className="grid-3">
            <div className="glass-panel route-card" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(15, 23, 42, 0.4)' }}>
               <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
               <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>Smart Optimized Routing</h3>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Using mathematical node evaluation via Dijkstra's shortest path & A* Geolocation mapping, we guarantee the most efficient pricing or duration seamlessly linking hubs.</p>
            </div>
            {/* ... keeping it brief ... */}
            <div className="glass-panel route-card" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(15, 23, 42, 0.4)' }}>
               <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
               <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>Budget Hopping</h3>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Constraint limits? Our Dynamic Knapsack engine figures out the maximum variety of cities you can afford to visit under your strict budget constraints via your Dashboard.</p>
            </div>
            <div className="glass-panel route-card" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(15, 23, 42, 0.4)' }}>
               <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
               <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>Admin Big Data</h3>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Complete corporate oversight plotting Warshall Adjacency reachability and absolute network Kruskal Spanning Trees to identify pure optimal routes.</p>
            </div>
         </div>
      </section>
    </div>
  );
}

export default LandingPage;
